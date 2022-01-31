function wrap(value) {
  return "<" + value + ">";
}

function decode_property_names(x, range) {
  var result = x;
  var values = range;

  values.forEach(function(row) {
    result = result.replace(row[0], row[1])
    // result = result + row[0] * x;
    // row.forEach(function(col) {
    //   result += col * x;
    // });
  });
  
  return result;
}

function decode(x) {
  return decode_property_names(x, SpreadsheetApp.getActiveSpreadsheet().getRange("'property-human-readable-labels'!$A$2:$B").getValues());
}

function drop_duplicates(array) {
  var unique_elements = new Set(array);
  var output = new Array();
  unique_elements.forEach(function(element){
    output.push(element);
  })
  return output;
}

function find_all(text, regexp) {
  text = text.substr(text.search(regexp))
  var matches = new Array()

  while (true) {
    match = regexp.exec(text)
    if (match != null) {
      first_group_content = match[0]
      if (!matches.includes(first_group_content)) {
        matches.push(first_group_content)
      }
      text = text.substr(first_group_content.length)
    } else {
      return matches
    }
  }
}

function replace_all(x, pattern, replacement) {
  x_before_replacement = x;
  var i = 0;
  while (true) {
    x = x_before_replacement.replace(pattern, replacement);
    if (x == x_before_replacement) {
      break
    }
    x_before_replacement = x
  }
  return x
}

function get_mapping_from_external_service(label) {
  // return "orkgf:bar"
  var response = UrlFetchApp.fetch("http://foo.bar:12/map?label=" + label, {"headers": {"Authorization": "baz qux"}});
  return JSON.parse(response.getContentText())["mapping"];
}

function decode_property_names_(x, range) {
  var result = x;
  var values = range;
  var mappings = {};
  var tagret_prefixes = [];

  values.forEach(function(row){
    mappings[row[0]] = row[1];
    prefix = row[0].split(':')[0];
    if (prefix != '' && !tagret_prefixes.includes(prefix)) {
      tagret_prefixes.push(prefix);  
    }
  });

  var human_readable_label_regexp = new RegExp("((?:" + tagret_prefixes.join("|") + "):[a-z_0-9]+)");
  var labels_for_replacement = new Array("");
  var is_there_at_least_one_match = x.search(human_readable_label_regexp) > -1;

  if (is_there_at_least_one_match) {
    labels_for_replacement = find_all(x, human_readable_label_regexp);

    labels_for_replacement.forEach(function(label){
      var mapping = mappings[label];
      if (mapping != null) {
        x = replace_all(x, label, mapping);
      } else {
        x = replace_all(x, label, get_mapping_from_external_service(label));
      }
    })
  }
  return x;
}

function map(x) {
  return decode_property_names_(x, SpreadsheetApp.getActiveSpreadsheet().getRange("'property-human-readable-labels'!$A$2:$B").getValues());
}

//
//
//

function find_all_(text, regexp, group_index) {
  text = text.substr(text.search(regexp))
  var matches = new Array()

  while (true) {
    match = regexp.exec(text)
    if (match != null) {
      group_content = match[group_index]
      if (!matches.includes(group_content)) {
        matches.push(group_content)
      }
      text = text.substr(match[0].length - 1)
    } else {
      return matches
    }
  }
}

function snake_to_camel_case(string) {
  var result = "";
  var is_capitalized = false;
  for (var i = 0; i < string.length; i++) {
    let char = string[i];
    if (char == "_") {
      is_capitalized = true;
    } else {
      if (is_capitalized) {
        result += char.toUpperCase();
        is_capitalized = false;
      } else {
        result += char;
      }
    }
  }
  return result
}

function replace_prefices(x, mapping) {
  let user_entered_prefices = mapping.filter((element) => (element[0] != "")).map((element) => (element[0]));
  let label_pattern = "(\\s)(" + user_entered_prefices.join("|") + "):([a-z_]+)([^A-Z])";
  let label_regexp = new RegExp(label_pattern);

  var mappings = {};

  var labels_for_replacement = new Array("");
  var is_there_at_least_one_match = x.search(label_regexp) > -1;

  mapping.forEach((row) => {
    mappings[row[0]] = row[1];
  })

  if (is_there_at_least_one_match) {
    labels_for_replacement = find_all_(x, label_regexp, 0);

    labels_for_replacement.forEach(
      (label) => {
        let match = label_regexp.exec(label);
        // return match[1];
        x = replace_all(
          x,
          match[1] + match[2] + ":" + match[3] + match[4],
          match[1] + mappings[match[2]] + ":" + snake_to_camel_case(match[3]) + match[4]
        )
      }
    )

    // return labels_for_replacement
    // labels_for_replacement.forEach(function(label){
    //  var mapping = mappings[label];
    //  if (mapping != null) {
    //    x = replace_all(x, label, mapping);
    //  } else {
    //    x = replace_all(x, label, get_mapping_from_external_service(label));
    //  }
    // })
  }
  return x;
}

function prettify(x) {
  return replace_prefices(x, SpreadsheetApp.getActiveSpreadsheet().getRange("'prefices-mapping'!$A$2:$B").getValues());
}

console.log(wrap("12"))
