function query_patch(text, type_list) {
  function filter_name_patch() {
    text = text.replaceAll("compare filters:", "filters compare:");
    text = text.replaceAll("shared filters:", "filters shared:");
  }

  function filter_name_recover_patch() {
    text = text.replaceAll("filters compare:", "compare filters:");
    text = text.replaceAll("filters shared:", "shared filters:");
  }

  /**
   * patch: add bracket
   * input form: identify: [] filters: []
   * output form: [identify: []] [filters: []]
   */
  function bkt_patch() {
    let type_index = [],
      result = "";
    type_list.forEach((d) => {
      let idx = text.indexOf(d);
      if (idx != -1) type_index.push(idx);
    });
    type_index.sort((a, b) => a - b);
    type_index.forEach((d, i) => {
      if (i === type_index.length - 1) {
        result += "[ " + text.slice(d) + " ]";
      } else {
        result += "[ " + text.slice(d, type_index[i + 1]) + " ] ";
      }
    });
    text = result;
  }

  filter_name_patch();
  bkt_patch();
  filter_name_recover_patch();
  //   console.log("text", text);
  return text;
}

/**
 * function: parse
 * @requires patch() patch
 * @param {string} generated_text generated query text
 * @returns {object} parsed result
 */
function query_string_parse(generated_text) {
  // console.log(generated_text);
  let types = ["identify :", "compare :"];
  let filters = ["filters:", "compare filters:", "shared filters:"];
  let filters_patched = ["filters:", "filters compare:", "filters shared:"];
  let ops = ["=", "<", ">", "range", "in"];

  let query = {};
  let clean_text = query_patch(generated_text, types.concat(filters_patched));
  // console.log(clean_text);

  // construct tree structure
  let stack = [],
    node_list = [],
    nested = { id: -1 },
    cur_id = -1;
  for (let i = 0, txt_len = clean_text.length; i < txt_len; ++i) {
    let char = clean_text[i];
    if (char === "[") {
      stack.push(i);
      let new_id = node_list.length;
      node_list.push({ id: new_id, pid: cur_id });
      cur_id = new_id;
    } else if (char === "]") {
      let l_idx = stack.pop();
      let r_idx = l_idx + 1;
      for (; r_idx < clean_text.length; r_idx++) {
        if (clean_text[r_idx] === "[" || clean_text[r_idx] === "]") break;
      }
      node_list[cur_id].name = clean_text.slice(l_idx + 1, r_idx).trim();
      node_list[cur_id].text = clean_text.slice(l_idx + 1, i).trim();
      cur_id = node_list[cur_id].pid;
    }
  }

  function appendChildren(node) {
    let children = node_list.filter((d) => d.pid === node.id);
    if (children.length) {
      node.children = children;
      node.children.forEach((d) => appendChildren(d));
    }
  }
  appendChildren(nested);
  //   console.log(JSON.stringify(nested, null, 2));

  // parse type (identify | compare)
  function parse_type() {
    let type_node = nested.children.filter((d) => types.indexOf(d.name) != -1);
    if (type_node.length === 0) return;
    type_node = type_node[0];
    // parse type name
    query.type = type_node.name.slice(0, -2);
    // parse operation
    if ("children" in type_node === false) {
      alert("invalid type");
      return;
    }
    query.result = {};
    if (type_node.children.length != 1) {
      alert("type children number", type_node.children.length);
    }
    let child = type_node.children[0];
    if ("children" in child === true) {
      query.result.agg = child.name.trim();
      if (child.children.length != 1) {
        alert("aggregation children number", child.children.length);
      }
      query.result.attr = child.children[0].name.trim();
    } else {
      query.result.attr = child.name.trim();
    }
  }

  function parse_filter(node) {
    let filter = {};
    // rank (top rank | bottom rank)
    if (node.name === "top rank" || node.name === "bottom rank") {
      filter.attr = {
        rank: { attr: node.children[0].name, dir: node.name.split(" ")[0] },
      };
      filter.op = "=";
      if (node.text.indexOf("<") > 0) filter.op = "<";
      else if (node.text.indexOf(">") > 0) filter.op = ">";
      filter.values = node.children[1].name.split("|").map((d) => d.trim());
    } else {
      let name_list = node.name.split(" ");
      let name_last = name_list.slice(-1)[0];
      if (ops.indexOf(name_last) != -1) {
        filter.op = name_last === "in" ? "range" : name_last;
        name_list.pop();
      }
      filter.attr = name_list.join(" ");
      filter.values = node.children[0].name.split("|").map((d) => d.trim());
    }
    return filter;
  }

  function parse_filters() {
    let filter_nodes = nested.children.filter(
      (d) => filters.indexOf(d.name) != -1
    );
    filter_nodes.forEach((d) => {
      let filter_name = d.name.slice(0, -1);
      query[filter_name] = d.children.map((node) => parse_filter(node));
    });
  }

  parse_type();
  parse_filters();

  // console.log(JSON.stringify(query, null, 2));
  return query;
}
