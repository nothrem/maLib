/**
 * jQueryProcess
 * https://github.com/nothrem/jQueryProcess
 * Improved jQuery Deferred that will always remember scope given into the promise.
 * Code based on jQuery code of $.Deferred function
 * Code improved for better performance and extended by Nothrem Sinsky: https://github.com/nothrem
 * (c) 2015
 */

(function($) {
    if (!$) { return; }

    $.Process = function( init ) {
        if (!(this instanceof $.Process)) {
            throw "Cannnot use Process constructor as a function!";
        }
        $.ProcessFactory.call(this, {}, init);
    };

    $.ProcessFactory = function( source, init ) {
        var process;

        if (this instanceof $.Process) {
            process = this;
        }
        else {
            process = new $.Process( init );
            process.promise(source);
            return process;
        }

        var tuples = [
                // action, add listener, listener list, final state, listeners for process
                // must be created every time because of the $.Callbacks()
                [ "resolve", "done", $.Callbacks("once memory"), "resolved", $.Callbacks("once memory") ],
                [ "reject", "fail", $.Callbacks("once memory"), "rejected", $.Callbacks("once memory") ],
                [ "notify", "progress", $.Callbacks("memory"), undefined, $.Callbacks("memory") ]
            ],
            events = ['on', 'one', 'off', 'trigger', 'triggerHandler'],
            state = "pending",
            promise = {
                state: function() {
                    return state;
                },
                always: function() {
                    process.done( arguments ).fail( arguments );
                    return this;
                },
                sync: function(process) {
                    promise
                        .done(process.resolve)
                        .fail(process.reject)
                        .progress(process.notify);
                    return source;
                },
                promise: function( obj ) {
                    source = promise.promiseWith(obj);
                    return source;
                },
                promiseWith: function( obj ) {
                    return obj ? $.extend( obj, promise ) : source;
                },
                ajax: function( obj ) {
                    promise.promise(obj);
                    return promise.ajaxWith(obj);
                },
                ajaxWith: function( obj ) {
                    var jqXHR = promise.promiseWith(obj);
                    jqXHR.success = jqXHR.done;
                    jqXHR.error = jqXHR.fail;
                    return jqXHR;
                },
                //ECMAScript 2015 (ES6) compatible methods
                all: function() {
                    var promises = [];
                    $.each(arguments, function() {
                        var me = this;
                        if (!me || 'function' !== typeof me.then) { return; }
                        promises.push(me);
                        me.then(function() {
                            var pos = promises.indexOf(me);
                            (pos < 0 || promises.splice(pos,1));
                            (promises.length || process.resolve());
                        }, process.reject);
                    });
                    return this;
                },
                race: function() {
                    $.each(arguments, function() {
                        (!this || 'function' != typeof this.then
                            || this.then(process.resolve, process.reject));
                    });
                    return this;
                },
                then: function(done, fail, progress) {
                    (!done || this.done(done));
                    (!fail || this.fail(fail));
                    (!progress || this.progress(progress));
                    return this;
                },
                'catch': function(onRejected) {
                    this.fail(onRejected);
                    return this;
                }
            };
        //var

        // Add event-specific methods
        $.each( events, function(i, method) {
            promise[method] = function() {
                var me = (this === process ? process : source);
                $.fn[method].apply($(me), arguments);
                return this;
            };
        } );

        // Add list-specific methods
        $.each( tuples, function( i, tuple ) {
            var list = tuple[ 2 ],
                listProc = tuple[ 4 ],
                stateString = tuple[ 3 ];

            // promise[ done | fail | progress ] = list.add
            promise[tuple[1]] = function() {
                if (this === process) {
                    listProc.add.apply(listProc, arguments);
                }
                else {
                    list.add.apply(list, arguments);
                }
                return this;
            };

            // Handle state
            if ( stateString ) {
                list.add(function() {
                    // state = [ resolved | rejected ]
                    state = stateString;

                // [ reject_list | resolve_list ].disable; progress_list.lock
                }, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
            }

            // process[ resolve | reject | notify ]
            process[ tuple[0] ] = function() {
                process[ tuple[0] + "With" ]( source , arguments );
                return this;
            };
            process[ tuple[0] + "Ajax" ] = function() {
                var args = arguments, jqXHR = promise.ajax();
                if ('resolve' === tuple[0]) { args = [args[0], args[1], jqXHR]; }
                else if ('reject' === tuple[0]) { args = [jqXHR, args[0], args[1]]; }
                window.setTimeout(function() { process[ tuple[0] + "With" ]( jqXHR , args ); }, 1);
                return this;
            };
            process[tuple[0] + "With"] = function(obj, args){
                if (state !== "pending") { return; } //already resolved, do not fire another event
                if ('notify' === tuple[0] && 'string' === typeof args[0]) {
                    args[0] = args[0].replace(' ', '_');
                    $.fn.trigger.apply($(process), args);
                    $.fn.trigger.apply($(obj), args);
                }
                listProc.fireWith(process, args);
                list.fireWith(obj, args);
                return this;
            };
        });

        //allow to register callback for specific event
        process.onCallback = function(event) {
            return function() {
                process.notify.apply(process, [event].concat([].slice.call(arguments))); //must convert arguments to array first, concat does not work on them!!!
            };
        };

        // Make the process a promise
        promise.promiseWith( process );
        promise.promise( source || {});

        // Call given func if any
        if ( init ) {
            init.call( process, process );
        }

        // All done!
        return process;
    };

})(window.jQuery);
