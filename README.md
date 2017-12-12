# timetable-knockout.js
Original code and readme was made by [Grible](https://github.com/Grible) in the component [Timetable.js](https://github.com/Grible/timetable.js).

Vanilla javascript plugin for building nice responsive timetables. Provides a simple javascript interface to add events and locations which can be rendered to nice HTML. Works on mobile devices as well.

## Installation
Download or clone the repository.

Load the plugin and styles in your HTML from the dist folder, remember to load knockout first and then timetable-knockout.js:
```html
<link rel="stylesheet" href="timetable-knockoutjs.css">
<script src="knockout.js"></script>
<script src="timetable-knockout.js"></script>
```
Add a timetable placeholder:
```html
<div class="timetable"></div>
```
## Usage

Create two observableArrays, one for Locations and other for Events:

```javascript
var locations = ko.observableArray([]);
var events = ko.observableArray([]);
```
Make a timetable object passing the observableArrays created, optionally set the scope in hours (the visible hours in the timetable):

```javascript
var timetable = new Timetable(locations, events);
timetable.setScope(9, 17); // optional, only whole hours between 0 and 23
```

Add some locations:
```javascript
locations.push("Silent Disco");
locations.push("Nile", "Len Room", "Maas Room");
```

Add your events creating an event object and pushing it to your events observableArray createEvent(name, location, startDate, endDate[, options]):
```javascript
var myEvent = timetable.createEvent('Frankadelic', 'Nile', new Date(2017,12,12,13,55), new Date(2017,12,12,20,30));
events.push(myEvent);
```

In addition, you can pass options such as URLs, classes, data-* attributes(data-bind also works), or color through an object:
```javascript
var options1 = {
  url: '#',
  class: 'vip',
  data: {
    id: 4,
    ticketType: 'VIP'
  },
  color: "black"
}
var options2 = {
  url: '#',
  class: 'vip',
  data: {
    id: 4,
    ticketType: 'VIP'
  }
}
var myEvent1 = timetable.createEvent('Frankadelic', 'Nile', new Date(2017,12,12,13,55), new Date(2017,12,12,20,30), options1);
var myEvent2 = timetable.createEvent('Frankadelic', 'Len Room', new Date(2017,12,12,13,55), new Date(2017,12,12,20,30), options2);
events.push(myEvent1, myEvent2);
```
#### You don't need to render anything, all the render is made automatically when locations or events change.

That's it!

## Browser Support
Timetable-knockout.js has been designed to work with modern browsers (only). It has been tested with the latest version of the most common browsers.
