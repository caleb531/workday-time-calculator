(function (m) {

class AppComponent {

	view() {
		return m('div.app', [
			m('header.app-header', [
				m('h1', 'Workday Time Calculator')
			]),
			m('div.app-content', [
				m('textarea.log-input', {
					placeholder: 'Paste your time log here'
				})
			])
		]);
	}

}

m.mount(document.body, AppComponent);

}(window.m, window.moment));
