document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('apiKey');
    const status = document.getElementById('status');
    const saveBtn = document.getElementById('save');
  input.value = ''
    // load key on open page
    chrome.storage.local.get('geminiApiKey', (result) => {
      if (result.geminiApiKey) {
        input.value = result.geminiApiKey;
      }
    });
  
    // check the key before saving
    async function validateApiKey(apiKey) {
      try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Hello" }] }],
          }),
        });

        // check if the response is ok
        return res.status === 200;
      } catch (e) {
        console.error('Request failed:', e);
        return false;
      }
    }
  
    saveBtn.addEventListener('click', async () => {
      const apiKey = input.value.trim();
      
      if (!apiKey) {
        status.textContent = '❌ الرجاء إدخال مفتاح.';
        status.className = 'text-red-600 text-center mt-4';
        return;
      }
  
      // check if the key is valid
      status.textContent = '⏳ جاري التحقق من المفتاح...';
      status.className = 'text-blue-600 text-center mt-4';
  
      try {
        const isValid = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Hello Gemini" }] }]
            }),
          }
        ).then(res => res.ok);
  
        if (isValid) {
          chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
            status.textContent = '✅ تم التحقق والحفظ بنجاح!';
            status.className = 'text-green-600 text-center mt-4';
          });
        } else {
          status.textContent = '❌ المفتاح غير صالح.';
          status.className = 'text-red-600 text-center mt-4';
        }
      } catch (err) {
        status.textContent = '⚠️ حدث خطأ أثناء التحقق.';
        status.className = 'text-red-600 text-center mt-4';
      }
      input.value = ''; // clear the input field after saving
    });
  });
  