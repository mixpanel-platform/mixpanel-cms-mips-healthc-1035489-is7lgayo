
var runQuery = function() {
  var dateRange = dateSelect.MPDatepicker('value');
  var today = new Date(dateRange.to).toISOString().split('T')[0]
  var t = new Date()
  var thisWeek = new Date(dateRange.from).toISOString().split('T')[0]
  var params ={
    start_date: thisWeek,
    end_date: today
  }
  MP.api.jql(function main() {
    return Events({
      from_date: params.start_date,
      to_date:   params.end_date
      //event_selectors:[{event:'10 Spot Viewed'},{event:'Article Selected'},{event:'MySI Viewed'},{event:'News Viewed'},{event:'Olypics Viewed'},{event:'Score Viewed'}]
    })
    .groupBy(["name",function(event){ return new Date(event.time).getDay()}], mixpanel.reducer.count())
    .map(function(item){
      return {
        "*Event*": item.key[0],
        "Day of Week": item.key[1],
        "Tally of Views": item.value
      }
    })
  }, params
  ).done(function(results){
    var data = []
    var segment = {}
    _.each(results, function(value){
      segment[value['*Event*']] ={}
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
    var chart = $('#graph').MPChart({chartType: 'line', highchartsOptions: {
      legend: {
        enabled: false,
        y: -7
      },
      tooltip: {
        formatter: function () {
          return "<b>Day of the week: </b>" + dayInWeek + "</br><b>Number of " + this.series.name + "s in : </b>" + this.y
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
  })
};
