// ################### HTML Injection ####################
const targetNav = document.getElementsByClassName("s-menu1")[4];
const myDiv = document.createElement("div");
myDiv.innerHTML = `
  <div id="word-explanation-container">
    <h3><i class="fa fa-book px-2"></i>شرح الألفاظ</h3>
    <div id="word-explanation" class="px-2 mb-4">جارٍ التحميل...</div>
  </div>
`;
targetNav?.prepend(myDiv);

// ################### Gemini API ####################
async function generateContent(poemText, apiKey) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `هذه قصيدة باللغة العربية:\n(${poemText})\nاشرح فقط الألفاظ الصعبة أو غير المألوفة حسب سياقها.`,
          },
        ],
      },
    ],
    systemInstruction: {
      role: "system",
      parts: [
        {
          text: `You are an expert in Arabic poetry and lexicon. Your task is to identify and explain only the difficult or uncommon words in the given poem, based on their context.
          You must respond with valid JSON only in the format:
          {
            "explanations": [
              {"word": "word1", "meaning": "explanation1"},
              {"word": "word2", "meaning": "explanation2"}
            ]
          }

          Do not add any extra text, markdown, or formatting. Respond with pure JSON only.`,
        },
      ],
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    const replyText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    try {
      const jsonResponse = JSON.parse(replyText.replace(/```/g, '').replace(/json/g, ''));
      return jsonResponse;
    } catch (e) {
      return { error: "الرد ليس بصيغة JSON صالحة." };
    }
  } catch (error) {
    return { error: "حدث خطأ أثناء الاتصال بـ Gemini." };
  }
}

// ################### Main Logic ####################
chrome.storage.local.get("geminiApiKey", async (result) => {
  const apiKey = result.geminiApiKey;

  if (!apiKey) {
    document.getElementById("word-explanation").innerText =
      "⚠️ لم يتم إعداد مفتاح Gemini API بعد.";
    return;
  }

  const poemLines = Array.from(document.querySelectorAll("#poem_content h3"))
    .map((el) => el.innerText.trim())
    .filter((line) => line.length > 0);

  const poemText = poemLines.join("\n");

  const jsonResponse = await generateContent(poemText, apiKey);

  if (jsonResponse.error) {
    document.getElementById("word-explanation").innerText = jsonResponse.error;
    return;
  }

  const explanations = jsonResponse.explanations || [];

  const explanationHTML = explanations
    .map(
      (item) =>
        `<p><strong>${item.word}:</strong> ${item.meaning}</p>`
    )
    .join("");

  document.getElementById("word-explanation").innerHTML = explanationHTML;
  mm()
});

// ############# Function to Highlight the word and scroll to it ###############
let wordsExplaned = [];

function scrollToWord(index) {
  console.log("clicked index:", index);
  let element = document.querySelectorAll("strong")[index];
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    // Highlight the word
    element.style.backgroundColor = "#ffeb3b"; // Highlight color
    setTimeout(() => {
      element.style.backgroundColor = ""; // Remove highlight after 2 seconds
    }, 2000);
  }
  
}

function mm() {
  // Cleaning up the previous wordsExplaned array
  wordsExplaned = [];

  let wordsFromPage = document.querySelectorAll("strong");

  for (let index = 0; index < wordsFromPage.length; index++) {
    // Delete the :
    let cleanWord = wordsFromPage[index].innerHTML.replace(/:/g, '');
    wordsExplaned.push(cleanWord);
  }

  // Adding the clickable spans to the h3 elements
  document.querySelectorAll("#poem_content h3").forEach((shatter) => {
    for (let index = 0; index < wordsExplaned.length; index++) {
      let word = wordsExplaned[index];
      let regex = new RegExp(word, 'g');

      // Replace the word with a clickable span
      shatter.innerHTML = shatter.innerHTML.replace(
        regex,
        `<span class="clickable-word" data-index="${index}" style="background: #6f6f6f57; padding: 2px 5px; border-radius: 3px; cursor: pointer;">${word}</span>`
      );
    }
  });

  document.querySelectorAll(".clickable-word").forEach((span) => {
    span.addEventListener("click", function () {
      const index = this.getAttribute("data-index");
      scrollToWord(index);
    });
  });

}
