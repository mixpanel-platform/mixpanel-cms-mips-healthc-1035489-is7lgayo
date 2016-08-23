
var runEventQuery = function() {
  var eventName = eventSelect.MPEventSelect('value'),
  propName  = propSelect.MPPropertySelect('value'),
  dateRange = dateSelect.MPDatepicker('value');
  bucket = bucketSelect.MPSelect('value');
  console.log("selected event", eventName);
  console.log("selected property", propName);
  propName =  typeof propName != "string" ? propName = null : propName
  var bucketValue
  if (bucket === 'day') {
    bucketValue = function(event){ return new Date(event.time).getDay()}
  }else{
    bucketValue = function(event){ return new Date(event.time).getHours()}
  }
  var today = new Date(dateRange.to).toISOString().split('T')[0]
  var t = new Date()
  var thisWeek = new Date(dateRange.from).toISOString().split('T')[0]
  var params ={
    start_date: thisWeek,
    end_date: today,
    selectedEvent: eventName,
    selectedProperty: propName,
    selectedBucket: bucket
  }
  if(params.selectedProperty){
    console.log("this is the jql query for when a property is selected");
    MP.api.jql(function main() {
      return Events({
        from_date: params.start_date,
        to_date:   params.end_date,
        event_selectors:[{event:params.selectedEvent}]
      })
      .groupBy(["name",'properties.'+params.selectedProperty, function (event) {if (params.selectedBucket === 'day') {
        return new Date(event.time).getDay()
      }else {
        return new Date(event.time).getHours()
      }}], mixpanel.reducer.count())
      .map(function(item){
        return {
          "*Event*": item.key[0],
          "Property": item.key[1],
          "Day of Week": item.key[2],
          "Tally of Views": item.value
        }
      })
    }, params
    ).done(function(results){
      console.log("event segmentation", results);
      var segment = {}
      if (bucket !== 'day' ) {
        _.each(results, function(value){
          segment[value['Property']] ={}  //cre
        })
        _.each(results, function(value){  //give a value to all times of the day so that if an event later does not havea value we still assign it a value. if each event we graph doesn't have 24 values highcharts will not graph properly
          var i = 1
          while (i < 25) {
            var time
            if(i < 12){
              time = i + " am"
            }else if (i === 12) {
              time = i + " pm"
            }else if(i === 24){
              time = i - 12 + " am"
            }else{
              time = i -12 + " pm"
            }
            segment[value['Property']][time] = 0
            i++
          }
        })
        _.each(results, function(value){
          _.each(segment, function (object, key) {
            var a = value['Day of Week']
            a += 1  //add one to get time denotion to be at index 1 not 0
            var time
            //modify the key value of the data object so that highcharts can properly order the data. if just number is passed highcharts throws error
            if(a < 12){
              time = a + " am"
            }else if (a === 12) {
              time = a + " pm"
            }else if(a === 24){
              time = a - 12 + " am"
            }else{
              time = a -12 + " pm"
            }
            segment[value['Property']][time] = value['Tally of Views']
          })
        })
        $('#graph').remove()            //remove the chart so that we can graph a new one with more xAxis values so we do not throw highcharts error #19
        _.each(segment, function(object){
          _.each(object, function(value, key){
          })
        })
        console.log("data after transformation", segment);
        var chart = $('<div id="graph"></div>').appendTo('#graph-container').MPChart({chartType: 'line', highchartsOptions: {
          legend: {
            enabled: false,
            y: -7
          },
          xAxis: {
            max: 23
          },
          tooltip: {
            formatter: function () {
              var a = this.x + 1
              if(a < 12){
                time = a + " am"
              }else if (a === 12) {
                time = a + " pm"
              }else if(a === 24){
                time = a - 12 + " am"
              }else{
                time = a -12 + " pm"
              }
              return "<b>Hour in day: </b>" + time  + "</br><b>Number of " + eventName + "s in " + this.series.name + " : </b>" + this.y
            }
          },
          xAxis:{
            title: {
                    text: 'Hour in the Day'
                }
          },
          yAxis:{
            title: {
                    text: 'Counts'
                }
          }
        }})
        chart.MPChart('setData', segment)
      }else{
        _.each(results, function(value){
          segment[value['Property']] ={}
        })
        _.each(results, function(value){
          _.each(segment, function (object, key) {
            var day
            if(key === value['Property']){
              if(value['Day of Week'] === 0){
                day = "Sunday"
              }else if (value['Day of Week'] === 1) {
                day = "Monday"
              }else if (value['Day of Week'] === 2) {
                day = "Tuesday"
              }else if (value['Day of Week'] === 3) {
                day = "Wednesday"
              }else if (value['Day of Week'] === 4) {
                day = "Thursday"
              }else if (value['Day of Week'] === 5) {
                day = "Friday"
              }else if (value['Day of Week'] === 6) {
                day = "Saturday"
              }
              segment[value['Property']][day] = value['Tally of Views']
            }
          })
        })
        $('#graph').remove()
        console.log(segment);
        var chart = $('<div id="graph"></div>').appendTo('#graph-container').MPChart({chartType: 'line', highchartsOptions: {
          legend: {
            enabled: false,
            y: -7
          },
          tooltip: {
            formatter: function () {
              var dayInWeek
              if(this.x === 0){
                dayInWeek = "Sunday"
              }else if (this.x  === 1) {
                dayInWeek = "Monday"
              }else if (this.x  === 2) {
                dayInWeek = "Tuesday"
              }else if (this.x  === 3) {
                dayInWeek = "Wednesday"
              }else if (this.x === 4) {
                dayInWeek = "Thursday"
              }else if (this.x === 5) {
                dayInWeek = "Friday"
              }else if (this.x === 6) {
                dayInWeek = "Saturday"
              }
              return "<b>Day of the week: </b>" + dayInWeek + "</br><b>Number of " + eventName + "s in " + this.series.name + " : </b>" + this.y
            }
          },
          xAxis:{
            title: {
                    text: 'Day of the Week'
                }
          },
          yAxis:{
            title: {
                    text: 'Counts'
                }
          }
        }})
        chart.MPChart('setData', segment)
        var table = $('#table').MPTable({
          showPercentages: true,
          firstColHeader: 'Events By Day of Week'
        })
        //table.MPTable('setData',segment)
      }
    })
  }else{
    if (eventName){
      console.log("thi is the jql query if an event is selected");
      MP.api.jql(function main() {
        return Events({
          from_date: params.start_date,
          to_date:   params.end_date,
          event_selectors:[{event:params.selectedEvent}]
        })
        .groupBy(["name",function (event) {if (params.selectedBucket === 'day') {
          return new Date(event.time).getDay()
        }else {
          return new Date(event.time).getHours()
        }}], mixpanel.reducer.count())
        .map(function(item){
          return {
            "*Event*": item.key[0],
            "Day of Week": item.key[1],
            "Tally of Views": item.value
          }
        })
      }, params
      ).done(function(results){
        var segment = {} //create final data object that will be used in charts
        if (bucket !== 'day' ) {
          _.each(results, function(value){
            segment[value['*Event*']] ={}  //cre
          })
          _.each(results, function(value){  //give a value to all times of the day so that if an event later does not havea value we still assign it a value. if each event we graph doesn't have 24 values highcharts will not graph properly
            var i = 1
            while (i < 25) {
              var time
              if(i < 12){
                time = i + " am"
              }else if (i === 12) {
                time = i + " pm"
              }else if(i === 24){
                time = i - 12 + " am"
              }else{
                time = i -12 + " pm"
              }
              segment[value['*Event*']][time] = 0
              i++
            }
          })
          _.each(results, function(value){
            _.each(segment, function (object, key) {
              var a = value['Day of Week']
              a += 1  //add one to get time denotion to be at index 1 not 0
              var time
              //modify the key value of the data object so that highcharts can properly order the data. if just number is passed highcharts throws error
              if(a < 12){
                time = a + " am"
              }else if (a === 12) {
                time = a + " pm"
              }else if(a === 24){
                time = a - 12 + " am"
              }else{
                time = a -12 + " pm"
              }
              segment[value['*Event*']][time] = value['Tally of Views']
            })
          })
          $('#graph').remove()            //remove the chart so that we can graph a new one with more xAxis values so we do not throw highcharts error #19
          _.each(segment, function(object){
            _.each(object, function(value, key){
            })
          })
          var chart = $('<div id="graph"></div>').appendTo('#graph-container').MPChart({chartType: 'line', highchartsOptions: {
            legend: {
              enabled: false,
              y: -7
            },
            xAxis: {
              max: 23
            },
            tooltip: {
              formatter: function () {
                var a = this.x + 1
                if(a < 12){
                  time = a + " am"
                }else if (a === 12) {
                  time = a + " pm"
                }else if(a === 24){
                  time = a - 12 + " am"
                }else{
                  time = a -12 + " pm"
                }
                return "<b>Hour in day: </b>" + time + "</br><b>Number of " + eventName + "s in : </b>" + this.y
              }
            },
            xAxis:{
              title: {
                      text: 'Hour in the Day'
                  }
            },
            yAxis:{
              title: {
                      text: 'Counts'
                  }
            }
          }})
          chart.MPChart('setData', segment)
        }else{
          _.each(results, function(value){
            segment[value['*Event*']] ={}  //cre
          })
          _.each(results, function(value){
            _.each(segment, function (object, key) {
              var day
              if(key === value['*Event*']){
                if(value['Day of Week'] === 0){
                  day = "Sunday"
                }else if (value['Day of Week'] === 1) {
                  day = "Monday"
                }else if (value['Day of Week'] === 2) {
                  day = "Tuesday"
                }else if (value['Day of Week'] === 3) {
                  day = "Wednesday"
                }else if (value['Day of Week'] === 4) {
                  day = "Thursday"
                }else if (value['Day of Week'] === 5) {
                  day = "Friday"
                }else if (value['Day of Week'] === 6) {
                  day = "Saturday"
                }
                segment[value['*Event*']][day] = value['Tally of Views']
              }
            })
          })
          $('#graph').remove()
          var chart = $('<div id="graph"></div>').appendTo('#graph-container').MPChart({chartType: 'line', highchartsOptions: {
            legend: {
              enabled: false,
              y: -7
            },
            tooltip: {
              formatter: function () {
                var dayInWeek
                if(this.x === 0){
                  dayInWeek = "Sunday"
                }else if (this.x  === 1) {
                  dayInWeek = "Monday"
                }else if (this.x  === 2) {
                  dayInWeek = "Tuesday"
                }else if (this.x  === 3) {
                  dayInWeek = "Wednesday"
                }else if (this.x === 4) {
                  dayInWeek = "Thursday"
                }else if (this.x === 5) {
                  dayInWeek = "Friday"
                }else if (this.x === 6) {
                  dayInWeek = "Saturday"
                }
                return "<b>Day of the week: </b>" + dayInWeek + "</br><b>Number of " + eventName + "s in : </b>" + this.y
              }
            },
            xAxis:{
              title: {
                      text: 'Day of the Week'
                  }
            },
            yAxis:{
              title: {
                      text: 'Counts'
                  }
            }
          }})
          chart.MPChart('setData', segment)
        }
      })
    }else{
      console.log("this is the jql query if an event is not selected");
      MP.api.jql(function main() {
        return Events({
          from_date: params.start_date,
          to_date:   params.end_date
        })
        .groupBy(["name",function (event) {if (params.selectedBucket === 'day') {
          return new Date(event.time).getDay()
        }else {
          return new Date(event.time).getHours()
        }}], mixpanel.reducer.count())
        .map(function(item){
          return {
            "*Event*": item.key[0],
            "Day of Week": item.key[1],
            "Tally of Views": item.value
          }
        })
      }, params
      ).done(function(results){
        var segment = {}    //create final data object that will be used in charts
        _.each(results, function(value){
          segment[value['*Event*']] ={}  //cre
        })
        _.each(results, function(value){      //give a value to all times of the day so that if an event later does not havea value we still assign it a value. if each event we graph doesn't have 24 values highcharts will not graph properly
          var i = 1
          while (i < 25) {
            var time
            if(i < 12){
              time = i + " am"
            }else if (i === 12) {
              time = i + " pm"
            }else if(i === 24){
              time = i - 12 + " am"
            }else{
              time = i -12 + " pm"
            }
            segment[value['*Event*']][time] = 0
            i++
          }
        })
        _.each(results, function(value){
          var i = 1
          _.each(segment, function (object, key) {
            var a = value['Day of Week']
            a += 1  //add one to get time denotion to be at index 1 not 0
            var time
            //modify the key value of the data object so that highcharts can properly order the data. if just number is passed highcharts throws error
            if(a < 12){
              time = a + " am"
            }else if (a === 12) {
              time = a + " pm"
            }else if(a === 24){
              time = a - 12 + " am"
            }else{
              time = a -12 + " pm"
            }
            segment[value['*Event*']][time] = value['Tally of Views']
          })
        })

        $('#graph').remove()            //remove the chart so that we can graph a new one with more xAxis values so we do not throw highcharts error #19
        var chart = $('<div id="graph"></div>').appendTo('#graph-container').MPChart({chartType: 'line', highchartsOptions: {
          legend: {
            enabled: false,
            y: -7
          },
          xAxis: {
            max: 23,
            // categories:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]
            //categories:['12 am', '1 am', '2 am', '3 am', '4 am', '5 am', '6 am', '7 am ', '8 am', '9 am', '10 am', '11 am', '12 pm', '1 pm', '2 pm', '3 pm', '4 pm', '5 pm', '6 pm', '7 pm', '8 pm', '9 pm', '10 pm', '11 pm', '12pm' ]
          },
          tooltip: {
            formatter: function () {
              var a = this.x + 1
              if(a < 12){
                time = a + " am"
              }else if (a === 12) {
                time = a + " pm"
              }else if(a === 24){
                time = a - 12 + " am"
              }else{
                time = a -12 + " pm"
              }
              return "<b>Hour in day: </b>" + time + "</br><b>Number of " + this.series.name + "s in : </b>" + this.y
            }
          },
          xAxis:{
            title: {
                    text: 'Hour in the Day'
                }
          },
          yAxis:{
            title: {
                    text: 'Counts'
                }
          }
        }})
        console.log("data for event segmentation by hour", segment);
        chart.MPChart('setData', segment)
      })
    }
  }
};
