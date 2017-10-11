(function (m, moment) {

let logTimeFormat = 'h:mma';

class AppComponent {

  getLineDepth(logLine) {
    return Math.round(logLine.search(/\S/) / 4);
  }

  getLineContent(logLine) {
    let matches = logLine.match(/^\s*\d+\. (.*?)$/);
    if (matches) {
      return matches[1];
    } else {
      return null;
    }
  }

  parseLineTimes(logLine) {
    return this.getLineContent(logLine)
      .split(/\s*to\s*/)
      .map((timeStr) => {
        return this.makeTimeStrAbsolute(timeStr);
      });
  }

  makeTimeStrAbsolute(timeStr) {
    let hour = parseInt(timeStr, 10);
    if (hour > 11 || hour < 7) {
      return `${timeStr}pm`;
    } else {
      return `${timeStr}am`;
    }
  }

  getClients(logText) {

    let logLines = logText.split('\n');
    let clients = [];
    let currentClient = null;

    logLines.forEach((logLine) => {
      if (logLine.trim() !== '') {
        let lineDepth = this.getLineDepth(logLine);
        if (lineDepth === 0) {
          // This is a top-level client (or Internal)
          currentClient = {
            timeRanges: []
          };
          clients.push(currentClient);
        } else if (lineDepth === 1) {
          // This is a time range string
          let timeStrs = this.parseLineTimes(logLine);
          currentClient.timeRanges.push({
            startTime: moment(timeStrs[0], logTimeFormat),
            endTime: moment(timeStrs[1], logTimeFormat)
          });
        }
      }
    });

    return clients;

  }

  calculateClientSums(clients) {
    clients.forEach((client) => {
      client.timeRanges.forEach((timeRange) => {
        console.log(timeRange);
      });
    });
  }

  parseTextLog(logText) {

    let clients = this.getClients(logText);
    this.calculateClientSums(clients);
    console.log(clients);

  }

  view() {
    return m('div.app', [
      m('header.app-header', [
        m('h1', 'Workday Time Calculator')
      ]),
      m('div.app-content', [
        m('textarea.log-input', {
          // TODO: uncomment this
          // autofocus: true,
          placeholder: 'Paste your time log here',
          oninput: (event) => {
            this.parseTextLog(event.target.value);
            localStorage.setItem('logText', event.target.value);
          },
          oncreate: (vnode) => this.parseTextLog(vnode.dom.value)
        }, localStorage.getItem('logText')),
        m('div.log-calculations')
      ])
    ]);
  }

}

m.mount(document.body, AppComponent);

}(window.m, window.moment));
