function init_upload() {
  let open_file = d3
    .select("body")
    .append("div")
    .attr("id", "open_file")
    .attr(
      "style",
      "position:absolute; top:0%; left: 0%; height: 100%; width: 100%; background: #F3F3F3;"
    );

  open_file.html(`
        <div id="upload_button" onclick="openFile()" class="beautiful" style="position: absolute; top: 30%; left: 35%; width: 30%; height: 25%; margin: 0px; padding: 0px; text-align: center; vertical-align: middle; ">
        <div style='justify-content: center; display: flex; position: relative; height: 100%; width: 100%; align-items: center;'>
            <svg width="84px" height="84px" viewBox="0 0 84 84" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="vertical-align: middle">
                <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                    <g id="upload" transform="translate(-681.000000, -412.000000)" fill="#7797FC" fill-rule="nonzero">
                        <g id="Local-Upload" transform="translate(681.000000, 412.000000)">
                            <path d="M79.8,0 C81.9292943,0.000280904155 83.7214726,1.5939299 83.9706,3.70860003 L84,4.20000003 L84,79.8 C83.9997191,81.9292943 82.4060701,83.7214726 80.2914,83.9706 L79.8,84 L63,84 L63,75.5999999 L75.5999999,75.5999999 L75.5999999,8.40000006 L8.40000006,8.40000006 L8.40000006,75.5999999 L21,75.5999999 L21,84 L4.20000003,84 C2.07070574,83.9997191 0.278527446,82.4060701 0.0294000328,80.2914 L0,79.8 L0,4.20000003 C0.000280904155,2.07070574 1.5939299,0.278527446 3.70860003,0.0294000328 L4.20000003,0 L79.8,0 Z" id="Path"></path>
                            <polygon id="Path" points="53.9971718 51.9957582 42 39.9957582 30.0028282 52 24 45.9978791 42 28 60 45.9978791"></polygon>
                            <polygon id="Path" points="46 38 46 84 38 84 38 38"></polygon>
                        </g>
                    </g>
                </g>
            </svg>
        </div>
        <div style="position: absolute; top:70%; width: 100%">
            <span style="vertical-align: middle; font-family: PingFangSC-Light; font-size: 26px; color: #575757;letter-spacing: 0.63px; text-align: center; justify-content: center; display: flex; position: relative; width: 100%">
                Click to Upload a Chart
            </span>
        </div>
        `);
  open_file.append("input").attr("type", "file").on("click", readFile);
}

function openFile() {
  console.log("open file");
  document.getElementById("click_to_upload").click();
}

function readFile(e) {
  var file = e.target.files[0];
  console.log("read file");
  if (!file) return;
  console.log("file_name", file.name);
  window._filename = file.name;
  var reader = new FileReader();
  reader.onload = function (e) {
    // console.log("File content", e.target.result)
    if (file.name.endsWith("svg")) {
      // data = d3.csvParse(e.target.result)
      // console.log("svg string", e.target.result)
      svg_string = e.target.result;
      let vis_width = $("#visualization_part").width();
      let vis_height = $("#visualization_part").height();

      d3.select("#open_file").style("display", "none");

      d3.select("#visualization_part")
        .select("#visualization_content")
        .html(svg_string);

      let send_data = clean_svg(
        d3.select("#visualization_content"),
        vis_width * 0.8
      );

      send_data.filename = file.name;
      window._filename = send_data.filename;

      let text_bbox = get_text_bounding_box(
        "visualization_content",
        d3.select("#visualization_content").select("svg")
      );
      // console.log(text_bbox)
      send_data.text_bbox = text_bbox;
      send_data.font_size = get_popular_font_size(text_bbox);
      // console.log("font_size", send_data.font_size)
      // const screenshotTarget = d3.select('#visualization_content').select("svg").node
      const screenshotTarget = $("#visualization_content")[0];

      html2canvas(screenshotTarget).then((canvas) => {
        const base64image = canvas.toDataURL("image/png");
        send_data["base64image"] = base64image;
        upload_chart(send_data);
      });
    } else {
      alert("Current file is not an SVG file.");
    }
  };
  reader.readAsText(file);
}

function get_popular_font_size(text_bbox) {
  let text_heights = text_bbox
    .filter((d) => d.width > d.height)
    .map((d) => d.height);
  if (text_heights.length == 0) {
    return 16;
  }
  text_heights.sort((a, b) => a - b);
  return parseInt(text_heights[parseInt(text_heights.length / 2)] * 0.6);
}

function upload_chart(send_data) {
  $.ajax({
    type: "POST",
    url: "uploadChart",
    data: { svg: JSON.stringify(send_data) },
    success: function (response_data) {
      window._responce_data = response_data;
      console.log(response_data);
      // window.location.href = window.location.href.replace(
      //   "upload.html",
      //   `?${window._filename.replace('.svg', '')}`
      // );
      // svg_string = response_data.svg_string;
      // d3.select("#visualization_part")
      //   .select("#visualization_content")
      //   .html(svg_string);
    },
    error: function (jqXHR) {
      // $('.loading').hide()
      read_from_local_file();
      alert(
        "There is something wrong with our server. We have loaded the preload data."
      );
    },
  });
}

function load_data_information(format_data) {
  var mapping = format_data.mapping;
  draw_mapping(mapping);
}

function clean_svg(svg_container, vis_width) {
  let svg = svg_container.select("svg");
  if (svg.attr("viewBox") === null) {
    let width = svg.attr("width");
    let height = svg.attr("height");
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    let new_height = parseInt(vis_width * (height / width));
    let new_width = parseInt(vis_width);
    svg.attr("width", new_width);
    svg.attr("height", new_height);
  } else {
    var regexp2 = /[0-9]+/g;
    var number = svg.attr("viewBox").match(regexp2);
    let oldwidth = parseFloat(number[2]);
    let oldheight = parseFloat(number[3]);

    let new_width = parseInt(vis_width);
    let new_height = parseInt((oldheight / oldwidth) * vis_width);
    svg.attr("width", new_width);
    svg.attr("height", new_height);
  }

  send_data = purify_svg(svg);
  return send_data;
  // console.log("send_data", send_data)
}
