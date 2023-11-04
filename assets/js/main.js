(function() {

  function onQueryWebGpt(e) {

    // Disabling form elements.
    const instruction = document.getElementById('instruction');
    const query = document.getElementById('query');
    const submit = document.getElementById('submit');

    const web_gpt_output = document.getElementById('web_gpt_output');
    const terminal = document.getElementById('terminal-wrp');
    const terminalContent = document.getElementById('terminal');
    const errLbl = document.getElementById('web_gpt_error');
    instruction.disabled = true;
    query.disabled = true;
    submit.disabled = true;
    web_gpt_output.style.display = 'none';
    terminal.style.display = 'block';
    terminalContent.innerHTML = '';
    errLbl.style.display = 'none';

    // Getting a random socket channel from server.
    fetch('http://localhost:5000/magic/system/misc/gibberish?min=20&max=30', {
      method: 'GET',
    }).then(res => {
      return res.json();
    }).then(res => {

      // Closing old socket connection if it's already open.
      ainiro_con?.stop();

      // Buffer for HTML.
      let ainiroTempContent = '';

      // Opening socket.
      ainiro_con = new signalR.HubConnectionBuilder()
        .withAutomaticReconnect()
        .withUrl('http://localhost:5000/sockets', {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        }).build();
      ainiro_con.on(res.result, function (args) {

        // Making an object our of message.
        const obj = JSON.parse(args);

        // Checking type of message.
        if (obj.finished === true) {

          // We're done!
          instruction.disabled = false;
          query.disabled = false;
          submit.disabled = false;
          const tmp = document.createElement('div');
          tmp.className = 'success';
          tmp.innerHTML = 'Done!';
          terminalContent.appendChild(tmp);
          terminalContent.scrollTop = terminalContent.scrollHeight;

        } else if (obj.finish_reason) {

          // We've got a finish reason.
          const web_gpt_output = document.getElementById('web_gpt_output');
          web_gpt_output.className = 'web-gpt col-12 offset-lg-2 col-lg-8 p-3 mt-3 ' + obj.finish_reason;

        } else if (obj.type === 'system') {

          // System message.
          const tmp = document.createElement('div');
          tmp.innerHTML = obj.message;
          terminalContent.appendChild(tmp);
          terminalContent.scrollTop = terminalContent.scrollHeight;

        } else {

          // Normal content message.
          const web_gpt_output = document.getElementById('web_gpt_output');
          const converter = new showdown.Converter();
          ainiroTempContent += obj.message;
          web_gpt_output.innerHTML = converter.makeHtml(ainiroTempContent);
          if (web_gpt_output.style.display !== 'block') {
            web_gpt_output.style.display = 'block';
          }
          web_gpt_output.querySelectorAll('pre code').forEach((el) => {
            hljs.highlightElement(el);
          });
    }
      });
      ainiro_con.start().then(function () {

        // Invoking reCAPTCHA.
        grecaptcha.ready(function () {
          grecaptcha
            .execute('6LfVd20fAAAAAC2tcJ55RvOEkraQL390cDw2yiT2', { action: 'submit' })
            .then(function (token) {

              // Invoking query endpoint.
              let url = 'http://localhost:5000/magic/system/openai/query';
              url += '?session=' + encodeURIComponent(res.result);
              url += '&query=' + encodeURIComponent(query.value);
              url += '&instruction=' + encodeURIComponent(instruction.value);
              url += '&recaptcha_response=' + encodeURIComponent(token);
              fetch(url, {
                method: 'GET'
              })
              .then(response => {
                if (response.status !== 200) {
                  throw response;
                }
                return response.json();
              })
              .catch(error => {
                instruction.disabled = false;
                query.disabled = false;
                submit.disabled = false;
                error.json().then(error => {
                  errLbl.innerText = error.message;
                  errLbl.style.display = 'block';
                });
              });
            });
          });
      });
    });

    // Preventing default action.
    e.preventDefault();
  }

})();