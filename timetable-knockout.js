/*jshint -W079*/

'use strict';

var Timetable = function (locations, events) {
    this.scope = {
        hourStart: 0,
        hourEnd: 23
    };
    this.locations = locations.extend({notify: 'always'});
    this.events = events;
    this.oldLocations = [];
    this.oldEvents = [];
    this.locations.subscribe((value) => this.locationSubscriber(value));
    this.events.subscribe((value) => this.eventSubscriber(value));
};

Timetable.Renderer = function (tt) {
    if (!(tt instanceof Timetable)) {
        throw new Error('Initialize renderer using a Timetable');
    }
    this.timetable = tt;
};

(function () {
    function isValidHourRange(start, end) {
        return isValidHour(start) && isValidHour(end);
    }
    function isValidHour(number) {
        return isInt(number) && isInHourRange(number);
    }
    function isInt(number) {
        return number === parseInt(number, 10);
    }
    function isInHourRange(number) {
        return number >= 0 && number < 24;
    }
    function locationExistsIn(loc, locs) {
        return locs.indexOf(loc) !== -1;
    }
    function eventExistsIn(evt, evts) {
        var flag = false;
        evts.forEach(function (e) {
            if (e.name.indexOf(evt) != -1) {
                flag = true;
            }
        });
        return flag;
    }
    function getIndexOfEvent(evt, evts, loc) {
        var index = -1;
        for (var i = 0; i < evts.length; i++) {
            if (evts[i].name == evt && evts[i].location == loc) {
                index = i;
                break;
            }
        }
        return index;
    }
    function findEventsFromLocation(loc, evts) {
        var index = [];
        for (var i = 0; i < evts.length; i++) {
            if (evts[i].location == loc) {
                index.push(i);
            }
        }
        return index;
    }
    function isValidTimeRange(start, end) {
        var correctTypes = start instanceof Date && end instanceof Date;
        var correctOrder = start < end;
        return correctTypes && correctOrder;
    }
    function getDurationHours(startHour, endHour) {
        return endHour >= startHour ? endHour - startHour : 24 + endHour - startHour;
    }
    function isEqualLocations(oldLocs, newLocs) {
        for (var i = 0; i < oldLocs.length; i++)
            if (oldLocs[i] != newLocs[i])
                return false;
        return true;
    }
    function getOperationLocation(oldLocs, newLocs) {
        if (oldLocs.length > newLocs.length) //-1 = removed Location
            return -1;
        else if (oldLocs.length == newLocs.length && !isEqualLocations(oldLocs, newLocs)) //0 = renamed Location
            return 0;
        else //1 = added Location
            return 1;
    }
    function getRenamedLocationIndex(oldLocs, newLocs) {
        for(var i = 0; i < oldLocs.length; i++) {
            if (oldLocs[i] != newLocs[i])
                return i;
        }
    }
    function getRemovedLocationIndex(oldLocs, newLocs) {
        for (var i = 0; i < newLocs.length; i++) {
            if (newLocs[i] != oldLocs[i])
                return i;
        }
        return oldLocs.length - 1;
    }
    function getAddedLocationIndex(oldLocs) {
        return oldLocs.length;
    }

    Timetable.prototype = {
        setScope: function (start, end) {
            if (isValidHourRange(start, end)) {
                this.scope.hourStart = start;
                this.scope.hourEnd = end;
            } else {
                throw new RangeError('Timetable scope should consist of (start, end) in whole hours from 0 to 23');
            }

            var rdr = new Timetable.Renderer(this);
            rdr.draw('.timetable');

            return this;
        },
        removeLocation: function (Location) {
            var indexEvents = findEventsFromLocation(Location, this.events());

            if (indexEvents) {
                for (var i = 0; i < indexEvents.length; i++) {
                    this.removeEvent(this.events()[indexEvents[i] - i].name, Location);
                }
            }

            var rdr = new Timetable.Renderer(this);
            rdr.draw('.timetable');

            return this;
        },
        renameLocation: function (index) {
            var OldLocation = this.oldLocations[index];
            var newLocation = this.locations()[index];
            this.events().forEach(function (e) {
                if (e.location == OldLocation) {
                    e.location = newLocation;
                }
            });

            var rdr = new Timetable.Renderer(this);
            rdr.draw('.timetable');
           
            return this;
        },
        createEvent: function (name, location, start, end, options) {

            if (!isValidTimeRange(start, end)) {
                throw new Error('Invalid time range: ' + JSON.stringify([start, end]));
            }

            var optionsHasValidType = Object.prototype.toString.call(options) === '[object Object]';

            return ({
                name: name,
                location: location,
                startDate: start,
                endDate: end,
                options: optionsHasValidType ? options : undefined
            });
        },
        getEventInfo: function (name, location) {
            var event = {};
            this.events().forEach(function (e) {
                if (e.name.indexOf(name) != -1 && e.location.indexOf(location) != -1) {
                    console.log("entrou");
                    event = e;
                }
            });
            if (event) {
                return event;
            } else {
                throw new Error("Event cannot be found");
            }
        },
        locationSubscriber: function (value) {
            var op = getOperationLocation(this.oldLocations, this.locations());
            switch (op) {
                case 1:
                    var indexNewLocation = getAddedLocationIndex(this.oldLocations);
                    var newLocation = this.locations()[indexNewLocation];
                    if (!locationExistsIn(newLocation, this.oldLocations)) {
                        var rdr = new Timetable.Renderer(this);
                        rdr.draw('.timetable');
                        this.oldLocations = this.locations().slice(0);
                    }
                    else {
                        this.locations().pop();
                        throw new Error("This location already exists");
                    }
                    break;
                case 0:
                    var indexLocation = getRenamedLocationIndex(this.oldLocations, this.locations());
                    console.log(indexLocation);
                    if (!locationExistsIn(this.locations()[indexLocation], this.oldLocations)) {
                        this.renameLocation(indexLocation);
                        this.oldLocations = this.locations().slice(0);
                    } else {
                        var indexLocation = getRenamedLocationIndex(this.oldLocations, this.locations());
                        this.locations()[indexLocation] = this.oldLocations[indexLocation];
                        throw new Error("This location already exists");
                    }
                    break;
                case -1:
                    var indexRemoved = getRemovedLocationIndex(this.oldLocations, this.locations());
                    this.removeLocation(this.oldLocations[indexRemoved]);
                    this.oldLocations = this.locations().slice(0);
                    break;
            }
        },
        eventSubscriber: function (value) {
            var op = getOperationLocation(this.oldEvents, this.events());
            switch (op) {
                case 1:
                    var rdr = new Timetable.Renderer(this);
                    rdr.draw('.timetable');
                    this.oldEvents = this.events().slice(0);
                    break;
                case -1:
                    var rdr = new Timetable.Renderer(this);
                    rdr.draw('.timetable');
                    this.oldEvents = this.events().slice(0);
            }
        }
    };

    function emptyNode(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }

    function prettyFormatHour(hour) {
        var prefix = hour < 10 ? '0' : '';
        return prefix + hour + ':00';
    }

    Timetable.Renderer.prototype = {
        draw: function (selector) {
            function checkContainerPrecondition(container) {
                if (container === null) {
                    throw new Error('Timetable container not found');
                }
            }
            function appendTimetableAside(container) {
                var asideNode = container.appendChild(document.createElement('aside'));
                var asideULNode = asideNode.appendChild(document.createElement('ul'));
                appendRowHeaders(asideULNode);
            }
            function appendRowHeaders(ulNode) {
                for (var k = 0; k < timetable.locations().length; k++) {
                    var liNode = ulNode.appendChild(document.createElement('li'));
                    var spanNode = liNode.appendChild(document.createElement('span'));
                    spanNode.className = 'row-heading';
                    spanNode.textContent = timetable.locations()[k];
                }
            }
            function appendTimetableSection(container) {
                var sectionNode = container.appendChild(document.createElement('section'));
                var timeNode = sectionNode.appendChild(document.createElement('time'));
                appendColumnHeaders(timeNode);
                appendTimeRows(timeNode);
            }
            function appendColumnHeaders(node) {
                var headerNode = node.appendChild(document.createElement('header'));
                var headerULNode = headerNode.appendChild(document.createElement('ul'));

                var completed = false;
                var looped = false;

                for (var hour = timetable.scope.hourStart; !completed;) {
                    var liNode = headerULNode.appendChild(document.createElement('li'));
                    var spanNode = liNode.appendChild(document.createElement('span'));
                    spanNode.className = 'time-label';
                    spanNode.textContent = prettyFormatHour(hour);

                    if (hour === timetable.scope.hourEnd && (timetable.scope.hourStart !== timetable.scope.hourEnd || looped)) {
                        completed = true;
                    }
                    if (++hour === 24) {
                        hour = 0;
                        looped = true;
                    }
                }
            }
            function appendTimeRows(node) {
                var ulNode = node.appendChild(document.createElement('ul'));
                ulNode.className = 'room-timeline';
                for (var k = 0; k < timetable.locations().length; k++) {
                    var liNode = ulNode.appendChild(document.createElement('li'));
                    appendLocationEvents(timetable.locations()[k], liNode);/**/
                }
            }
            function appendLocationEvents(location, node) {
                for (var k = 0; k < timetable.events().length; k++) {
                    var event = timetable.events()[k];
                    if (event.location === location) {
                        appendEvent(event, node);
                    }
                }
            }
            function appendEvent(event, node) {
                var hasOptions = event.options !== undefined;
                var hasURL, hasAdditionalClass, hasDataAttributes, hasColor = false;

                if (hasOptions) {
                    hasURL = (event.options.url !== undefined) ? true : false;
                    hasAdditionalClass = (event.options.class !== undefined) ? true : false;
                    hasDataAttributes = (event.options.data !== undefined) ? true : false;
                    hasColor = (event.options.color !== undefined) ? true : false;
                }

                var elementType = hasURL ? 'a' : 'span';
                var aNode = node.appendChild(document.createElement(elementType));
                var smallNode = aNode.appendChild(document.createElement('small'));
                aNode.title = event.name;

                if (hasURL) {
                    aNode.href = event.options.url;
                }
                if (hasDataAttributes) {
                    for (var key in event.options.data) {
                        aNode.setAttribute('data-' + key, event.options.data[key]);
                    }
                }

                aNode.className = hasAdditionalClass ? 'time-entry ' + event.options.class : 'time-entry';
                aNode.style.width = computeEventBlockWidth(event);
                aNode.style.left = computeEventBlockOffset(event);
                if (hasColor) {
                    aNode.style.background = event.options.color;
                    aNode.style.border = event.options.color;
                }
                smallNode.textContent = event.name;

                ko.applyBindings({}, aNode);
            }
            function computeEventBlockWidth(event) {
                var start = event.startDate;
                var end = event.endDate;
                var durationHours = computeDurationInHours(start, end);
                return durationHours / scopeDurationHours * 100 + '%';
            }
            function computeDurationInHours(start, end) {
                return (end.getTime() - start.getTime()) / 1000 / 60 / 60;
            }
            function computeEventBlockOffset(event) {
                var scopeStartHours = timetable.scope.hourStart;
                var eventStartHours = event.startDate.getHours() + (event.startDate.getMinutes() / 60);
                var hoursBeforeEvent = getDurationHours(scopeStartHours, eventStartHours);
                return hoursBeforeEvent / scopeDurationHours * 100 + '%';
            }

            var timetable = this.timetable;
            var scopeDurationHours = getDurationHours(timetable.scope.hourStart, timetable.scope.hourEnd);
            var container = document.querySelector(selector);
            checkContainerPrecondition(container);
            emptyNode(container);
            appendTimetableAside(container);
            appendTimetableSection(container);
        }
    };

})();

