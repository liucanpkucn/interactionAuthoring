class Recognition {
  constructor(icon, waitTime) {
    let recognition = new webkitSpeechRecognition();
    let timer;

    recognition.continuous = true;
    recognition.interimResults = true;

    if (window.language === "en") {
      recognition.lang = "en-US";
      console.log("aaaaaaa english");
    } else {
      recognition.lang = "cmn-Hans-CN";
    }

    recognition.onresult = (event) => {
      this.result(event.results[0][0].transcript);
      clearTimeout(timer);
      timer = setTimeout(end, waitTime);
    };

    let start = (e) => {
      this.start(icon);
      icon.removeEventListener("click", start);
      icon.addEventListener("click", (e) => {
        clearTimeout(timer);
        timer = null;
        end();
      });
      recognition.start();
      timer = setTimeout(end, waitTime);
    };

    let end = () => {
      this.end(icon);
      icon.removeEventListener("click", end);
      icon.addEventListener("click", start);
      recognition.stop();
    };

    this.on = (mode, f) => {
      this[mode] = f;
      console.log(mode, this);
      return this;
    };
    this.run = () => {
      icon.addEventListener("click", start);
    };
  }
}

class add_dialog {
  constructor(dialog) {
    let dialog_content = dialog
      .append("div")
      .style("position", "absolute")
      .attr("id", "dialog_content")
      .style("width", "100%")
      .style("top", "0%")
      .style("height", "93%")
      .style("overflow-y", "scroll");

    let dialog_content_width = dialog_content.node().clientWidth;
    window._dialog_content_width = dialog_content_width;

    dialog_content.append("div").style("width", "100%").style("height", "10%");
    let padding = 10;

    let question_div = dialog
      .append("div")
      .attr("id", "input_box_container")
      .style("position", "absolute")
      .style("width", "100%");

    let question_width = question_div.node().clientWidth;
    let question_height = question_div.node().clientHeight;

    let send_button_size = 30;
    let send_button_inter = 5;

    let question_input = question_div
      .append("textarea")
      .classed("input_box", true)
      .attr("id", "input_box")
      .attr("placeholder", function () {
        return "Input your questions here";
      })
      .style("position", "absolute");
    // .style('width', (question_width - padding * 2 - send_button_size - send_button_inter) + 'px')
    // .style('height', (question_height - padding * 2) + 'px')
    // .style("padding", padding + 'px');

    let send_button = question_div
      .append("div")
      .attr("class", "send_button")
      .style("position", "absolute")
      // .style('right', "0%")
      // .style('bottom', "0%")
      .style("width", send_button_size + "px")
      .style("height", send_button_size + "px")
      .style("background", "#7AEAB0")
      .style("border-radius", "3px");

    window.addEventListener("load", function () {
      autoResizeTextArea();
    });

    document.getElementById("input_box").addEventListener("input", function () {
      autoResizeTextArea();
    });

    send_button.on("click", function () {
      let question_text = $(question_input.node()).val();
      console.log(question_text);
      if (question_text.length > 0) {
        ask_question(question_text);
      }
    });

    send_button
      .append("div")
      .style("position", "absolute")
      .style("left", "20%")
      .style("top", "20%")
      .style("width", "60%")
      .style("height", "60%")
      .html(
        '<svg t="1635387212592" width="100%" height = "100%" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2377" width="200" height="200"><path d="M431.1 960c-25.3 0-45.9-20.6-45.9-45.9V706.7c0-10.8 3.7-21 10.8-29.4l364.7-433-552.8 297.3L356.4 616c12.5 6.3 21.3 17.7 24.1 31.4 2.8 13.6-0.7 27.5-9.7 38.1-8.7 10.2-21.3 16.1-34.6 16.1-7 0-14.1-1.7-20.4-4.9L89.7 582.6c-15.5-7.8-25.3-23.5-25.5-41-0.2-17.4 9.2-33.3 24.6-41.5L892.2 69.5c6.7-3.6 14.2-5.5 21.7-5.5 13.1 0 25.6 5.7 34.4 15.6 8.8 9.9 12.8 22.7 11.2 36L863.4 904c-2.7 23-22.4 40.4-45.6 40.4-7.2 0-14.2-1.7-20.7-4.9L511.6 795.4c-12.5-6.3-21.3-17.7-24.1-31.4-2.8-13.7 0.7-27.7 9.7-38.5 8.7-10.3 21.4-16.2 34.9-16.2 7 0 14 1.7 20.3 4.8l228.2 114.2 65.5-542.6-367.2 437.6c-1.2 1.4-1.8 3.2-1.8 5V914c-0.1 25.4-20.7 46-46 46z" p-id="2378" fill="#5D5D5D"></path></svg>'
      );

    let micro_phone = question_div
      .append("div")
      .attr("id", "micro_phone")
      .style("position", "absolute")
      .style("right", send_button_size + 5 + "px")
      // .style('bottom', "0%")
      .style("width", send_button_size + "px")
      .style("height", send_button_size + "px");
    // .style('background', "#7AEAB0")
    // .style('border-radius', "3px");

    micro_phone.on("click", function () {
      console.log("click_micro_phone");
    });

    let micro_phone_icon_image = micro_phone
      .append("div")
      .style("position", "absolute")
      // .style('left', "20%")
      // .style('top', "20%")
      // .style('width', "60%")
      // .style('height', "60%")
      .style("width", "5%")
      .style("height", "5%")
      .style("width", "90%")
      .style("height", "90%");

    micro_phone_icon_image.html(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 36.1 59.73"><defs><style>.cls-1,.cls-2{fill:none;stroke:#96c7a4;stroke-miterlimit:10;stroke-width:2.2px;}.cls-1{stroke-linecap:round;}</style></defs><title>Voice</title><g id="text"><rect class="cls-1" x="6.85" y="1.1" width="22.4" height="43.93" rx="11.2"/><path class="cls-1" d="M35,35A17,17,0,1,1,1.1,35"/><line class="cls-2" x1="18.05" y1="51.99" x2="18.05" y2="58.64"/><line class="cls-1" x1="8.55" y1="58.64" x2="27.9" y2="58.64"/></g></svg>'
    );
    // .attr('width', "100%")
    // .attr('height', "100%")

    // .html('<svg id="micro_phone_icon" viewBox="0 0 1024 1024" width="100%" height="100%" style="cursor: pointer"><path d="M288 526.763c0 123.733 100.288 224 224 224 121.685 0 220.715-97.024 223.915-217.92l0.085-6.08h64c0 144.554-106.496 264.234-245.333 284.864v42.432l86.016 2.026-1.494 63.979-234.602-5.483 1.493-63.978 84.587 1.962v-38.57C343.744 803.243 227.413 682.26 224.064 533.376l-0.064-6.613h64z m224-377.43A170.667 170.667 0 0 1 682.667 320v213.333a170.667 170.667 0 1 1-341.334 0V320A170.667 170.667 0 0 1 512 149.333z m0 64a106.667 106.667 0 0 0-106.56 102.038l-0.107 4.629v213.333a106.667 106.667 0 0 0 213.227 4.63l0.107-4.63V320A106.667 106.667 0 0 0 512 213.333z" p-id="1283"></path></svg>');

    let waitTime = 2000; //多长时间不说话终止语音（ms）

    let micro_phone_icon = micro_phone.node();
    let textarea = question_input.node();

    new Recognition(micro_phone_icon, waitTime)
      .on("start", () => {
        // icon.setAttribute('fill', 'red')
        console.log("start");

        micro_phone_icon_image.html(
          '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 39.44 64.07"><defs><style>.cls-1{fill:#96c7a4;}.cls-2,.cls-3{fill:none;stroke:#96c7a4;stroke-miterlimit:10;stroke-width:2.4px;}.cls-2{stroke-linecap:round;}</style></defs><title>Voice</title><g id="text"><rect class="cls-1" x="7.49" width="24.47" height="48" rx="12.24"/><path class="cls-2" d="M38.24,37.08a18.52,18.52,0,1,1-37,0"/><line class="cls-3" x1="19.72" y1="55.61" x2="19.72" y2="62.87"/><line class="cls-2" x1="9.35" y1="62.87" x2="30.48" y2="62.87"/></g></svg>'
        );
      })
      .on("result", (text) => {
        console.log(text);
        $(question_input.node()).val(text);

        // textarea.innerText = text
      })
      .on("end", () => {
        // icon.setAttribute('fill', null)
        console.log("end");

        micro_phone_icon_image.html(
          '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 36.1 59.73"><defs><style>.cls-1,.cls-2{fill:none;stroke:#96c7a4;stroke-miterlimit:10;stroke-width:2.2px;}.cls-1{stroke-linecap:round;}</style></defs><title>Voice</title><g id="text"><rect class="cls-1" x="6.85" y="1.1" width="22.4" height="43.93" rx="11.2"/><path class="cls-1" d="M35,35A17,17,0,1,1,1.1,35"/><line class="cls-2" x1="18.05" y1="51.99" x2="18.05" y2="58.64"/><line class="cls-1" x1="8.55" y1="58.64" x2="27.9" y2="58.64"/></g></svg>'
        );
      })
      .run();

    $(question_input.node()).on("input propertychange paste", function (d) {
      let text = $(this).val();
      if (text.includes("\n")) {
        console.log(text);
        text = text.replace("\n", "");
        $(this).val(text);
        if (text !== "") ask_question(text);
      }
    });

    this.add_predefined_QA = function (QA_list) {
      QA_list.forEach((QA) => add_QA(QA));
      function add_QA(QA) {
        clear_question_box();
        let current_qa = add_question_to_dialog(QA.question);
        let vSpec_list = get_vega_setting(QA.attribute, QA.condition);
        console.log(vSpec_list);
        // if (vSpec_list.length === 0) {
        //     add_nl_answer_to_dialog("Your question seems not related to any attributes in the table. Please ask some other questions.", current_qa);
        // } else {

        let vis_id = makeid(10);
        let current_data = {
          attribute: QA.attribute,
          condition: QA.condition,
          vSpec_list: vSpec_list,
          question: QA.question,
          vis_id: vis_id,
        };

        add_vis_to_dialog(current_data, QA.question, current_qa);

        // }
      }
    };

    function makeid(length) {
      var result = "";
      var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      return result;
    }

    function ask_question(question) {
      ask_nl_mani_question(question);
      clear_question_box();
      autoResizeTextArea();
      let current_qa = add_question_to_dialog(question);
    }
    // delete the input box
    function clear_question_box() {
      $(question_input.node()).val("");
    }

    function add_question_to_dialog(question) {
      let current_qa = dialog_content
        .append("div")
        .classed("current_qa", true)
        .classed("new_style", true);

      let classify_line = current_qa
        .append("div")
        .style("width", "100%")
        .style("height", "2rem")
        .style("display", "flex")
        .attr("id", "classify_line_container")
        .style("justify-content", "space-between");

      classify_line.append("div").attr("id", "classify_line");

      // .style('background-color', "#FFF")
      let question_num = dialog_content.selectAll(".current_qa").nodes().length;

      current_qa
        .append("div")
        .attr("class", "question_container")
        .append("div")
        .attr("class", "question")
        .text(question);

      move_dialog_to_bottom();

      return current_qa;
    }

    function add_nl_answer_to_dialog(answer, current_qa) {
      let current_ans = current_qa
        .append("div")
        .attr("class", "nl_answer_container");

      current_ans.append("div").attr("class", "answer").text(answer);
      move_dialog_to_bottom();
    }

    function move_dialog_to_bottom() {
      let scrollHeight = dialog_content.node().scrollHeight;
      let clientHeight = dialog_content.node().clientHeight;
      let pos = scrollHeight - clientHeight;
      $(dialog_content.node()).animate(
        {
          scrollTop: pos,
        },
        100
      );
    }

    function add_vis_to_dialog(current_data, question, current_qa) {
      let vis_id = current_data.vis_id;
      let vSpec_list = current_data.vSpec_list;

      let current_div = current_qa
        .append("div")
        .attr("class", "answer_container")
        .append("div")
        .attr("class", "answer")
        .append("div")
        .attr("class", "answer_vega")
        .attr("id", vis_id)
        .style("height", dialog_content_width * 0.618 * 0.8 + "px")
        .style("width", dialog_content_width * 0.8 + "px");

      current_qa.datum(current_data);

      current_qa.on("click", function (e, d) {});

      //   update_data_info(current_data);
      move_dialog_to_bottom();
      //   draw_vis_on_div(vSpec_list, current_data);
    }
  }
}

function update_small_vis() {
  const screenshotTarget = $("#canvas")[0];
  let qas = d3.selectAll(".current_qa").nodes();
  let current_qa;
  if (qas.length == 0) {
    current_qa = d3
      .select("#dialog_content")
      .append("div")
      .attr("class", "current_qa");
  } else {
    current_qa = d3.select(qas[qas.length - 1]);
  }

  let new_chart_json = JSON.parse(JSON.stringify(_chart_object[0].chart_json));
  console.log(new_chart_json);

  let inner_width = $(".mainrect").width();
  let inner_height = $(".mainrect").height();

  let canvas_width = $("#canvas").width();
  let canvas_height = $("#canvas").height();

  let image_width = _dialog_content_width * 0.9;
  let image_height = (image_width * inner_height) / inner_width;

  let current_div = current_qa
    .append("div")
    .attr("class", "answer_container")
    .append("div")
    .attr("class", "answer")
    .style("width", image_width + "px")
    .style("height", image_height + "px")
    .datum(new_chart_json)
    .on("click", function (e, d) {
      console.log("click", d);
      canvas_main(d);
      _chart_object[0].update_highlight();
    });

  let dialog_content = d3.select("#dialog_content");

  let scrollHeight = dialog_content.node().scrollHeight;
  let clientHeight = dialog_content.node().clientHeight;
  let pos = scrollHeight - clientHeight;
  $(dialog_content.node()).animate(
    {
      scrollTop: pos,
    },
    100
  );

  html2canvas(screenshotTarget).then((canvas) => {
    const base64image = canvas.toDataURL("image/png");
    // calculate_white_edges(base64image, d3.select('#visualization_content').select('svg'))
    current_div
      .append("img")
      .attr("src", base64image)
      .style("width", parseInt((canvas_width * 100) / inner_width) + "%");
  });
}

function cropBase64Image(base64) {
  return new Promise((resolve, reject) => {
    // 创建一个Image对象并设置其src属性为base64格式的图片数据
    var img = new Image();
    img.onload = function () {
      try {
        let originwidth = img.naturalWidth;
        let originheight = img.naturalHeight;
        let width = parseInt($("#canvas").outerWidth(true));
        let height = parseInt($("#canvas").outerHeight(true));
        let inner_width = $(".mainrect").width();
        let inner_height = $(".mainrect").height();

        let new_width = (inner_width / width) * originwidth;
        let new_height = (inner_height / height) * originheight;

        console.log(new_width, new_height);

        let x = (originwidth - new_width) / 2;
        let y = (originheight - new_height) / 2;
        // 创建一个Canvas元素并设置其大小
        var canvas = document.createElement("canvas");
        canvas.width = new_width;
        canvas.height = new_width;

        // 在Canvas上绘制裁剪后的图片
        var ctx = canvas.getContext("2d");
        ctx.drawImage(
          img,
          x,
          y,
          new_width,
          new_height,
          0,
          0,
          new_width,
          new_height
        );

        // 将Canvas转换为base64格式的图片
        var croppedBase64 = canvas.toDataURL("image/png");

        // 返回裁剪后的base64格式图片数据
        resolve(croppedBase64);
      } catch (error) {
        reject(error);
      }
    };
    img.src = base64;
  });
}

function autoResizeTextArea() {
  var myTextarea = document.getElementById("input_box");
  var myDiv = document.getElementById("input_box_container");
  myTextarea.style.height = "auto";
  myTextarea.style.height = myTextarea.scrollHeight + "px";
  myDiv.style.height = myTextarea.style.height;
}

function fake_input(speed = 100) {
  let sentence =
    "Among India, Canada, and Germany, what is the country with the highest daily new cases from Nov 1 2021 to May 1 2022?\n";
  for (let i = 0; i < sentence.length; i++) {
    setTimeout(function () {
      autoResizeTextArea();
      $("#input_box").val(sentence.slice(0, i));
    }, i * speed); // random
  }
  setTimeout(function () {
    $(".send_button").click();
    autoResizeTextArea();
  }, sentence.length * speed*(0.6+0.8*Math.random()));
}
