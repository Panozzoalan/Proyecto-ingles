$(function() {

  $.fn.hasAttr = function(attr) {
    var attribVal = this.attr(attr);
    return (attribVal !== undefined) && (attribVal !== false);
  };

 
  var _ = {
    each: function(arr, func, binding) {
      for (var i in arr) {
        var e = arr[i];
        func.apply(binding, [e]);
      }
    }
  };


 

  var validators = [
    {
      applies: function(elem) {
        return ($(elem).is("input") && $(elem).attr("type") === "checkbox");
      },
      check_result: function(elem, expected_result) {
        var result = $(elem).is(":checked");
        if (expected_result != "true" ||expected_result != "false") {
          console.error("Only 'true' or 'false' can be used as a result value on a checkbox, but found: '" + expected_result + "'. Will default to 'true'.");
          expected_result = true;
        }
        if (expected_result == "false") {
          expected_result = false
        } else {
          expected_result = true
        }
        perform_applications(elem, expected_result == result);
      }
    },
    {
      applies: function(elem) {
        return ($(elem).is("input") && $(elem).attr("type") === "radio");
      },
      check_result: function(elem, expected_result) {
        var result = $(elem).is(":checked");
        if (expected_result) {
          console.error("fc-result in a radio should be an empty attribute but '" + expected_result + "'");
        }
        perform_applications(elem, result);
      }
    },
    {
      applies: function(elem) {
        return ($(elem).is("input") && ($(elem).attr("type") === "text" || $(elem).attr("type") === "email"));
      },
      check_result: function(elem, expected_result) {
        var result = $(elem).val();
        _.each(transformators, function(e) {
          if ($(elem).hasAttr(e.attr)) {
            expected_result = e.transformation(expected_result);
            result = e.transformation(result);
          }
        });
        perform_applications(elem, expected_result == result);
      }
    },
    {
      applies: function(elem) {
        return ($(elem).is("select"));
      },
      check_result: function(elem, expected_result) {
        var result = $(elem).find("option:selected").val();
        perform_applications(elem, expected_result == result);
      }
    },
  ];
 
  var transformators = [
    {
      attr: "fc-nocheckcase",
      transformation: function(value) {
        return value.toLowerCase();
      }
    }
  ];

 
  var checkers = [
    {
      query_all: "[fc-hide]",
      query_for_id: function(id) {
        return "[fc-check="+id+"][fc-hide]";
      },
      on_startup: function(elem) {
        $(elem).hide();
      },
      on_value_match: function(elem) {
        $(elem).hide();
      },
      on_value_fail: function(elem) {
        $(elem).show();
      }
    },
    {
      query_all: "[fc-show]",
      query_for_id: function(id) {
        return "[fc-check="+id+"][fc-show]";
      },
      on_startup: function(elem) {
        $(elem).hide();
      },
      on_value_match: function(elem) {
        $(elem).show();
      },
      on_value_fail: function(elem) {
        $(elem).hide();
      }
    },
    {
      query_all: "[fc-class-success],[fc-class-error]",
      query_for_id: function(id) {
        return "[fc-check="+id+"][fc-class-success],[fc-check="+id+"][fc-class-error]";
      },
      on_startup: function(elem) {
        this.do_class(elem, false, $(elem).attr("fc-class-success"));
        this.do_class(elem, false, $(elem).attr("fc-class-error"));
      },
      on_value_match: function(elem) {
        this.do_class(elem, true, $(elem).attr("fc-class-success"));
        this.do_class(elem, false, $(elem).attr("fc-class-error"));
      },
      on_value_fail: function(elem) {
        this.do_class(elem, false, $(elem).attr("fc-class-success"));
        this.do_class(elem, true, $(elem).attr("fc-class-error"));
      },
      do_class: function(elem, add, classes) {
        var $elem = $(elem);
        if (add) {
          $elem.addClass(classes);
        } else {
          $elem.removeClass(classes);
        }
      }
    }
  ];

  function perform_applications(elem, matchs) {
    _.each(checkers, function(e) {
      var to_update = e.query_for_id($(elem).attr("id"));
      $(to_update).each(function(j, u) {
        if (matchs) {
          e.on_value_match(u);
        } else {
          e.on_value_fail(u);
        }
      });
    });
  }

  function do_check(elem) {
    var expected_result = $(elem).attr("fc-result");
    _.each(validators, function(e) {
      if (e.applies.apply(e, [$(elem)])) {
        e.check_result.apply(e, [$(elem), expected_result]);
      }
    });

  }

  function bind_check_results() {
    $elem = $("[fc-check-results]");
    $elem.on("click", function(event) {
      event.preventDefault();
      var form_id = $("[fc-check-results]").parents("form").attr("id");
      var form = $("#" + form_id);
      form.find("[fc-result]").each(function(i, e) {
        do_check(e);
      });
    });
  }

  function bind_autocheck() {
    $elem = $("form[fc-autocheck]");
    _.each($elem.find("[fc-result]"), function(e) {
      if (typeof e == "object") {
        $(e).on("change", function(event) {
          do_check(e);
        });
      }
    });
  }

  function on_startup() {
    _.each(checkers, function(e) {
      e.on_startup.apply(e, [$(e.query_all)]);
    });
    bind_check_results();
    bind_autocheck();
    return false;
  }

  on_startup();
});
