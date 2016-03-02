$(document).ready(function() {

    $("#date").datepicker({
        todayBtn: "linked",
        format: "yyyy-mm-dd",
        autoclose: true
    }).on("changeDate", function(e){
        // trigger when date changes
        var shift = $("input[name=shiftCheckbox]:checked").val();

        if (shift) {
            var fields = shift.split(":");
            var start_date = $("#date").val() + " " + fields[0] + ":00:00";
            var end_date = $("#date").val() + " " + fields[1] + ":00:00";

            load_charts(start_date, end_date);
        } else {
            remove_error_msg();
            print_error_msg("Select the time interval and try again.");
        }
    });

    // handle shift changing
    $('input[type=radio][name=shiftCheckbox]').change(function() {
        $("#date").trigger("changeDate");
    });

    function render_area_charts(data, start_date, end_date) {
        // list of chars
        var charts = [
            {key: "temp_chart", id: "temp"},
            {key: "speed_chart", id: "speed"},
            {key: "current_chart", id: "current"}
        ];

        var x_c = d3.time.scale().domain([get_date(start_date), get_date(end_date)]).range([0, width]);
        var x_t = d3.time.scale().domain([get_date(start_date), get_date(end_date)]).range([0, width]);
        var x_s = d3.time.scale().domain([get_date(start_date), get_date(end_date)]).range([0, width]);

        for (var i = 0; i < charts.length; i++) {
            var x = d3.time.scale().domain([get_date(start_date), get_date(end_date)]).range([0, width]);

            var y = d3.scale.linear()
                .domain([0, d3.max(data[charts[i].key], function(d) { return parseFloat(d.value); })])
                .range([height, 0]);

            var yAxis = d3.svg.axis()
                .scale(y)
                .ticks(5)
                .orient("left");

            var area = d3.svg.area()
                .x(function(d) { return x(format.parse(d.current_date.date)); })
                .y0(height)
                .y1(function(d) { return y(d.value); });

            var svg = d3.select("svg#" + charts[i].id)
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("viewBox", "0 0 1168 100")
                .attr("preserveAspectRatio", "xMidYMid")
                .attr("shape-rendering", "crispEdges")
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            svg.append("path")
                .datum(data[charts[i].key])
                .attr("d", area)
                .on("mousemove", function(d) {
                    var x_pos = d3.mouse(this)[0];
                    var time = x_s.invert(x_pos);
                    var current = data.current_chart[bisectDate(data.current_chart, x_c.invert(x_pos), 1)];
                    var temp = data.temp_chart[bisectDate(data.temp_chart, x_t.invert(x_pos), 1)];
                    var speed = data.speed_chart[bisectDate(data.speed_chart, x_s.invert(x_pos), 1)];
                    render_tooltip(current, temp, speed, time);
                })
                .on("mouseout", function(d) {
                    div.transition()        
                        .duration(300)      
                        .style("opacity", 0);
                });

            svg.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(-10,0)")
                .call(yAxis);

            if (i == charts.length - 1) {
                // render bottom x axis with ticks
                var xAxis = d3.svg.axis()
                    .scale(x)
                    .ticks(5)
                    .tickFormat(d3.time.format('%H:%M:%S'))
                    .orient("bottom");

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis)
            } else {
                var xAxis = d3.svg.axis()
                    .scale(x)
                    .ticks(0)
                    .tickFormat(d3.time.format('%H:%M:%S'))
                    .orient("top");

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis)
            }
            // add label
            svg.append("text")
                .attr("class", "y label")
                .attr("text-anchor", "start")
                .style("font-size", "110%")
                .attr("transform",
                    "translate(" + margin.left * -1 +"," + (height + margin.top + margin.bottom) / 2 + ")")
                .text(charts[i].id[0].toUpperCase() + charts[i].id.slice(1));
            
        }
    };

    function render_status_chart(data, start_date, end_date) {
        var x_c = d3.time.scale().domain([get_date(start_date), get_date(end_date)]).range([0, width]);
        var x_t = d3.time.scale().domain([get_date(start_date), get_date(end_date)]).range([0, width]);
        var x_s = d3.time.scale().domain([get_date(start_date), get_date(end_date)]).range([0, width]);

        var x = d3.time.scale().domain([get_date(start_date), get_date(end_date)]).range([0, width]);

        var y = d3.scale.ordinal()
            .domain(d3.range(2))
            .rangeRoundBands([2, height], .01);

        // get top status svg element
        var svg = d3.select("svg#status")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("viewBox", "0 0 1168 100")
            .attr("preserveAspectRatio", "xMidYMid")
            .attr("shape-rendering", "crispEdges")
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var layer = svg.selectAll(".layer")
            .data(data.current_chart)
            .enter().append("g")
            .attr("class", "layer")
            .style("fill", function(d, i) {
                if (d.value > 100) return "#006600"
                return "#cc0000"
            });

        layer.selectAll("rect")
            .data(function(d) {return [d];})
            .enter().append("rect")
            .attr("y", function(d) { return 30; })
            .attr("x", function(d) {
                var index = data.current_chart.indexOf(d);
                return index == 0 ? 0: x(format.parse(data.current_chart[index - 1].current_date.date));
            })
            .attr("height", y.rangeBand())
            .attr("width", function(d) {
                var index = data.current_chart.indexOf(d);
                var date = x(format.parse(d.current_date.date));
                return index == 0 ? date: date - x(format.parse(data.current_chart[index - 1].current_date.date));
            })
            .on("mousemove", function(d) {
                var x_pos = d3.mouse(this)[0];
                var time = x_s.invert(x_pos);
                var current = data.current_chart[bisectDate(data.current_chart, x_c.invert(x_pos), 1)];
                var temp = data.temp_chart[bisectDate(data.temp_chart, x_t.invert(x_pos), 1)];
                var speed = data.speed_chart[bisectDate(data.speed_chart, x_s.invert(x_pos), 1)];
                render_tooltip(current, temp, speed, time);
            })
            .on("mouseout", function(d) {
                div.transition()        
                    .duration(300)      
                    .style("opacity", 0);
            });
        // render top x axis
        var xAxis = d3.svg.axis()
            .scale(x)
            .ticks(5)
            .tickFormat(d3.time.format('%H:%M:%S'))
            .orient("bottom");

        svg.append("g")
            .attr("class", "x axis")
            .call(xAxis);

        // add labels
        svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "start")
            .style("font-size", "110%")
            .attr("transform",
                "translate(" + margin.left * -1 +"," + (height + margin.top + margin.bottom) / 2 + ")")
            .text("ON");

        svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "start")
            .style("font-size", "110%")
            .attr("transform",
                "translate(" + margin.left * -1 +"," + (height + margin.top + margin.bottom + 30) / 2  + ")")
            .text("OFF");
    }


    function render_tooltip(current, temp, speed, time) {
        speed = speed ? speed: {value: 0};
        temp = temp ? temp: {value: 0};
        current = current ? current: {value: 0};
        time = d3.time.format("%H:%M:%S")(time)
        var status = current.value > 100 ? "ON": "OFF";
        div.transition()
            .duration(200)
            .style("opacity", .9);
        div.html([
            "Time:" + time + "<br>",
            "Speed:" + speed.value + "<br>",
            "Temperature:" + temp.value + "<br>",
            "Current:" + current.value + "<br>",
            "Status:" + status + "<br>",
        ].join(''))
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
    }

    var margin = {top: 5, right: 0, bottom: 29, left: 100},
        width = 1168 - margin.left - margin.right,
        height = 110 - margin.top - margin.bottom;

    var format = d3.time.format("%Y-%m-%d %H:%M:%S")
    var bisectDate = d3.bisector(function(d) {return format.parse(d.current_date.date)}).left

    function get_date(date) {
        return format.parse(date);
    };

    function load_charts(start_date, end_date) {
        $.ajax({
            url: "/data",
            type: "GET",
            data: {
                start_date: start_date,
                end_date: end_date,
                tank_rotator: $("#tankRotator :selected").val(),
                power_source: $("#powerSource :selected").val(),
                temp_panel: $("#temperaturePanel :selected").val()

            },
            beforeSend: function(xhr) {
                remove_error_msg();
                // start animation
                $(".spinner").show();
                // disable datepicker
                $("#date").prop('disabled', true);
                $('input[type=radio][name=shiftCheckbox]').prop('disabled', true);
            },
            success: function(data) {
                if (data.temp_chart.length > 0 || data.speed_chart.length > 0 || data.current_chart.length > 0) {
                    // remove charts
                    $("div svg").empty();

                    render_area_charts(data, start_date, end_date);
                    render_status_chart(data, start_date, end_date);
                } else {
                    var interval = start_date + "," + end_date;
                    print_error_msg("Data at a given interval(" + interval + ") not found.");
                }
            },
            error: function(error) {
                var error_msg = error.readyState == 4 ? error.statusText: "Server not responding."; 
                print_error_msg(error_msg);
            },
            complete: function(xhr) {
                // stop animation
                $(".spinner").hide();
                // enable datepicker
                $("#date").prop('disabled', false);
                $('input[type=radio][name=shiftCheckbox]').prop('disabled', false);
            },
        });
    };

    function print_error_msg(text) {
        // add label after date input field
        $("#date").after("<label class='text-danger'>" + text + "</label>");
    };

    function remove_error_msg(text) {
        $("#date").next(".text-danger").remove();
    };

    function get_last_data(id, IMEI_number, index) {
        // index: 0 - pw, 1 - tp, 2 - tr
        $.ajax({
            url: "/last_data",
            type: "GET",
            data: {id: id, IMEI_number: IMEI_number},
            success: function(data) {
                set_data_to_table(data, index);
            },
        });
    }

    var interval_ids = new Array(3);

    $("#powerSource, #temperaturePanel, #tankRotator").change(function() {
        var ids = ["powerSource", "temperaturePanel", "tankRotator"];
        var index = ids.indexOf($(this).prop("id"));
        
        clearInterval(interval_ids[index]);
        var IMEI_number = $(this).val();
        var id = $(this).prop("id");
        get_last_data(id, IMEI_number, index);

        interval_ids[index] = setInterval(function() {
            get_last_data(id, IMEI_number, index);
        }, 30000);
    });

    function set_data_to_table(data, index) {
        // set data to cell with current index
        var cells = $("tbody tr td strong");
        if (index == 0) {
            $(cells[0]).text(data.value > 100 ? "ON": "OFF");
            $(cells[1]).text(data.value + " A");
        }
        else if (index == 1) {
            $(cells[2]).text(data.value + " C");
        }
        else if (index == 2) {
            $(cells[3]).text(data.value + " mm/min");
        }
    };

    function calculateDateInterval(date) {
        var hours = date.getHours();
        var shifts = ['shift1', 'shift2', 'shift3', 'shift4', 'shift5', 'shift6'];
        return 'shift' + (Math.floor(hours / 4) + 1)
    }
    // Define the div for the tooltip
    var div = d3.select("body").append("div")   
        .attr("class", "tooltip")               
        .style("opacity", 0);

    // load default charts
    var date = new Date();
    var shift = calculateDateInterval(date);
    $('#' + shift).prop("checked", true)
    // set default date
    var calendar_format = d3.time.format("%Y-%m-%d")
    $("#date").val(calendar_format(date));

    $("#date").trigger("changeDate");
    $("#powerSource").trigger("change");
    $("#temperaturePanel").trigger("change");
    $("#tankRotator").trigger("change");
});
