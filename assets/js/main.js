(function() {

  // reCAPTCHA site-key.
  const reCaptcha = '6LfVd20fAAAAAC2tcJ55RvOEkraQL390cDw2yiT2';

  // Our SignalR socket connection.
  let ainiro_con = null;

  // Buffer for result from query.
  let ainiroTempContent = '';

  /*
   * Function invoked when user performs a search.
   * e is event object.
   */
  function onFormSubmit(e) {

    // Preventing default action.
    e.preventDefault();

    // Resetting connection.
    ainiro_con?.stop();
    ainiro_con = null;

    // Disabling form elements.
    $('#search_form input, textarea, button').prop('disabled', 'disabled');

    // Hiding output in case this is consecutive query.
    $('#output').css('display', 'none');

    // Resetting result elements.
    $('#terminal').html('');
    ainiroTempContent = '';

    // Fetching gibberish used for our SignalR channel.
    $.ajax({
      dataType: 'json',
      url: 'http://localhost:5000/magic/system/misc/gibberish',
      data: {
        min: 20,
        max: 20
      },
      success: (data) => connect(data.result),
    });
  }

  /*
   * Connects to result SignalR web socket.
   * channel is name of SignalR method invoked from server when new messages are ready.
   */
  function connect(channel) {

    // Creating our connection builder.
    ainiro_con = new signalR.HubConnectionBuilder()
      .withAutomaticReconnect()
      .withUrl('http://localhost:5000/sockets', {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      }).build();

    // Subscribing to messages passed over channel.
    ainiro_con.on(channel, (msg) => onMessage(JSON.parse(msg)));

    // Starting SignalR connection.
    ainiro_con.start().then(() => sendQuery(channel));
  }

  /*
   * Invoked when a query should be sent to server.
   */
  function sendQuery(channel) {

    // Invoking reCAPTCHA.
    grecaptcha.ready(function () {
      grecaptcha
        .execute(reCaptcha, { action: 'submit' })
        .then(function (token) {

          // Invoking query endpoint.
          $.ajax({
            dataType: 'json',
            url: 'http://localhost:5000/magic/system/openai/query',
            data: {
              session: channel,
              query: $('#query').val(),
              instruction: $('#instruction').val(),
              recaptcha_response: token,
            }
          });
        });
    });
  }

  /*
   * Invoked when server sends us a message.
   * msg is message sent from server as object.
   */
  function onMessage(msg) {

    // Checking type of message.
    if (msg.finished === true) {

      // We're done!
      $('#instruction').removeAttr('disabled');
      $('#query').removeAttr('disabled');
      $('#submit').removeAttr('disabled');

      // Adding the final done message to inform user that we're done with search.
      const tmp = document.createElement('div');
      tmp.className = 'success';
      tmp.innerHTML = 'Done!';
      $('#terminal').append(tmp);
      $('#terminal')[0].scrollTop = $('#terminal')[0].scrollHeight;

    } else if (msg.type === 'system') {

      // System message.
      if ($('#terminal').html() === '') {
        $('#terminal-wrp').css('display', 'block');
      }
      const tmp = document.createElement('div');
      tmp.innerHTML = msg.message;
      $('#terminal')[0].append(tmp);
      $('#terminal')[0].scrollTop = $('#terminal')[0].scrollHeight;
  
    } else if (msg.message) {

      // Normal content message.
      const converter = new showdown.Converter();
      ainiroTempContent += msg.message;
      const output = $('#output');
      output.html(converter.makeHtml(ainiroTempContent));
      output.css('display', 'block');
      output[0].querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el);
      });
    }
  }

  // Attaching submit event to form, and associating with callback.
  $('#search_form').on('submit', (event) => onFormSubmit(event));

})();