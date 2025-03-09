let recognition;
let isRecognizing = false;
let silenceTimer;
let audioContext;
let analyser;
let microphone;
let dataArray;
let canvas;
let canvasCtx;

function getSpeak() {
    let micSpace = document.getElementById("micSpace");
    let speechBubble = document.getElementById("speechBubble");
    let micButton = document.getElementById("myButton");
    let micIcon = micButton.querySelector("img");

    if (speechBubble.style.display === "none" || !speechBubble) {
        speechBubble.style.display = "block";
    }

    if (!isRecognizing) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = function () {
            isRecognizing = true;
            console.log("Start...");
            document.getElementById("recognizedText").innerText = "Listening...";
            startVisualizer(micButton);
        };

        recognition.onresult = function (event) {
            let transcript = "";
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript + " ";
            }
            document.getElementById("recognizedText").innerText = transcript.trim();
            console.log("Realtime Input: ", transcript.trim());

            clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
                recognition.stop();
                isRecognizing = false;
            }, 2000);
        };

        recognition.onerror = function (event) {
            console.error("Speech Recognition Error:", event.error);
            document.getElementById("recognizedText").innerText = "Error: " + event.error;
            isRecognizing = false;
            stopVisualizer(micButton, micIcon);
        };

        recognition.onend = function () {
            if (document.getElementById("recognizedText").innerText == "Listening...") {
                // document.getElementById("recognizedText").innerText = "Speak nothing";
                document.getElementById("recognizedText").innerText = "Create a button to remove the yellow area";
                // document.getElementById("recognizedText").innerText = "Allow zoom in zoom out to rescale axis";
                // document.getElementById("recognizedText").innerText = "Allow the x-axis to be reordered based on height when the right button is clicked";
                // document.getElementById("recognizedText").innerText = "Allow the selected area to move to the bottom when the button is clicked";
                // document.getElementById("recognizedText").innerText = "Show tooltip for x value";
                // document.getElementById("recognizedText").innerText = "Allow overlap stacked bar chart";
            }
            console.log("End");
            isRecognizing = false;
            stopVisualizer(micButton, micIcon);

            // let recognizedText = document.getElementById("recognizedText").innerText;
            let recognizedText = "Create a button to remove the yellow area";
            // let recognizedText = "Allow zoom in zoom out to rescale axis";
            // let recognizedText = "Allow the x-axis to be reordered based on height when the right button is clicked";
            // let recognizedText = "Allow the selected area to move to the bottom when the button is clicked";
            // let recognizedText = "Show tooltip for x value";
            // let recognizedText = "Allow overlap stacked bar chart";
            if (recognizedText && recognizedText !== "Listening..." && recognizedText !== "Speak nothing") {
                console.log("Sending recognized text to LLM:", recognizedText);
                // sendToLLM(recognizedText);
                // _chart_object[0].x_axis_object_list[0].activate_sort('click', 'height');
                // _chart_object[0].CoordSys[2].activate_move_to_bottom();
                // _chart_object[0].CoordSys[2].activate_value_tooltip('x');
                // _chart_object[0].CoordSys[2].activate_allow_overlap();
                console.log("HI");
            }
        };

        recognition.start();
    } else {
        console.log("Stop...");
        recognition.stop();
        isRecognizing = false;
        stopVisualizer(micButton, micIcon);
    }
}

// speech bubble close
function closeSpeechBubble() {
    let speechBubble = document.getElementById("speechBubble");
    let micButton = document.getElementById("myButton");
    let micIcon = micButton.querySelector("img");

    if (speechBubble) {
        speechBubble.style.display = "none";
    }

    if (isRecognizing && recognition) {
        console.log("Stopping speech recognition...");
        recognition.stop();
        isRecognizing = false;
        stopVisualizer(micButton, micIcon);
    }
}

// web audio API
async function startVisualizer(micButton) {
    let micIcon = micButton.querySelector("img");
    micIcon.style.display = "none";

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            createVisualizerCanvas(micButton);
            drawVisualizer();
        } catch (error) {
            console.error("Microphone access denied:", error);
        }
    }
}

// draw visualizer
function drawVisualizer() {
    if (!isRecognizing) return;

    requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.fillStyle = "rgba(0, 0, 0, 0)";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const bars = 4;
    const gap = 5;
    const barWidth = (canvas.width - (gap * (bars - 1))) / bars / 2;
    let barHeight;

    for (let i = 0; i < bars; i++) {
        const startIdx = Math.floor((i * dataArray.length) / bars);
        const endIdx = Math.floor(((i + 1) * dataArray.length) / bars);
        const avgValue = dataArray.slice(startIdx, endIdx).reduce((a, b) => a + b, 0) / (endIdx - startIdx);

        barHeight = avgValue / 3;

        const x = (i+1) * (barWidth + gap);
        const centerY = canvas.height / 2;
        const y = centerY - barHeight / 2;

        canvasCtx.fillStyle = `rgb(50, 150, 250)`;
        canvasCtx.fillRect(x, y, barWidth, barHeight);
    }
}

// show visualizer
function createVisualizerCanvas(micButton) {
    canvas = document.createElement("canvas");
    canvas.id = "visualizerCanvas";
    canvas.width = 50;
    canvas.height = 50;
    canvasCtx = canvas.getContext("2d");

    micButton.appendChild(canvas);
}

// stop visualizer & mic icon restore
function stopVisualizer(micButton, micIcon) {
    let visualizerCanvas = document.getElementById("visualizerCanvas");

    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    if (visualizerCanvas) {
        visualizerCanvas.remove();
    }

    micIcon.style.display = "block";
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("myButton").addEventListener("click", getSpeak);

    let closeButton = document.createElement("button");
    closeButton.innerHTML = "X";
    closeButton.id = "closeButton";
    closeButton.style.position = "absolute";
    closeButton.style.top = "20px";
    closeButton.style.right = "-15px";
    closeButton.style.background = "red";
    closeButton.style.color = "white";
    closeButton.style.border = "none";
    closeButton.style.cursor = "pointer";
    closeButton.style.padding = "6px 10px";
    closeButton.style.fontSize = "18px";
    closeButton.style.borderRadius = "20px";

    closeButton.addEventListener("click", closeSpeechBubble);

    let speechBubble = document.getElementById("speechBubble");
    if (speechBubble) {
        speechBubble.appendChild(closeButton);
        speechBubble.style.display = "none";
        speechBubble.style.position = "relative";
    }
});

function sendToLLM(userInput) {
    const LM_STUDIO_API_URL = "http://localhost:1234/v1";
    const MODEL_NAME = "llama-3.2-1b-instruct";
    
    const prompt = `
    ### INSTRUCTION ###
    Extract structured information from the given user instruction and format the output as JSON.
    
    ### JSON Output Format ###
    {
        "action": {
            "type": "drag" | "click" | "slide",   
            "target": {
                "type": "axis" | "visual element" | "button" | "slider",
                "label": "x-axis" | "y-axis" | "area chart" | "sort" | "filter"
            },
            "destination": "horizontal" | "vertical" | "x-axis" | "y-axis" | "visual element" | "outside canvas" (optional)
        },
        "result": {
            "type": "sort" | "swap" | "zoom" | "filter" | "highlight",    
            "target": "visual element" | "x-axis" | "y-axis" | "axes" | "area chart" | "stacked bar chart" | "grouped bar chart" | "bubble chart" | "line chart" | "bar chart",  
            "parameter": "color" | "position" | "height" | "order" | "range"
        }
    }
    
    ### RULES ###
    1. Response **MUST** be in JSON format without any additional explanation.
    2. **Do not** include any extra text, only return the **single** JSON object.
    3. "destination" field **MUST ONLY** be included for "drag" actions.
    4. **Directional Mapping:**  
       - If the input contains "left and right", set "destination": "horizontal".  
       - If the input contains "up and down", set "destination": "vertical".  
    5. **Slider Rules:**  
       - If "slider", "slide", or "filter" appears in the input, set "action.type": "slide".  
       - "target.type" **MUST** be "slider", and "target.label" **MUST** be "filter".  
       - "destination" field **MUST NOT** be present for "slide" actions.  
    6. Ensure all values match the predefined options exactly.
    
    
    ### EXAMPLES ###
    #### Example 1
    INPUT:
    "Create a slider with five steps (1 to 5) that highlights visual elements within the selected range."  
    
    OUTPUT:
    {
        "action": {
            "type": "slide",
            "target": {
                "type": "slider",
                "label": "filter"
            }
        },
        "result": {
            "type": "highlight",
            "target": "visual elements",
            "parameter": "range"
        }
    }
    
    #### Example 2
    INPUT:
    "Allow drag the x-axis to the y-axis to swap the position of the axis."
    
    OUTPUT:
    {
        "action": {
            "type": "drag",
            "target": {
                "type": "axis",
                "label": "x-axis"
            },
            "destination": "y-axis"
        },
        "result": {
            "type": "swap",
            "target": "axes",
            "parameter": "position"
        }
    }
    
    #### Example 3
    INPUT:
    "Allow users to drag the x-axis left and right to zoom in on the x-axis range."
    
    OUTPUT:
    {
        "action": {
            "type": "drag",
            "target": {
                "type": "axis",
                "label": "x-axis"
            },
            "destination": "horizontal"
        },
        "result": {
            "type": "zoom",
            "target": "x-axis",
            "parameter": "range"
        }
    }
    
    
    ### INPUT ###
    ` + userInput + `
    
    ### RESPONSE (Only ONE JSON, no explanation) ###`;

    const requestBody = {
        model: MODEL_NAME,
        messages: [
            { role: "system", content: "You are a helpful assistant. Always return only JSON." },
            { role: "user", content: prompt }
        ],
        temperature: 0.0
    };

    fetch(`${LM_STUDIO_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data => {
        const responseText = data.choices[0].message.content;
        try {
            const parsedJson = JSON.parse(responseText);
            console.log("\n### Structured Output ###");
            console.log(JSON.stringify(parsedJson, null, 4));
            receiveJson(parsedJson);
            console.log(parsedJson);
            // return JSON.stringify(parsedJson, null, 4);
        } catch (error) {
            console.error("Invalid JSON format received:", responseText);
        }
    })
    .catch(error => console.error("Error communicating with LLM:", error));
}