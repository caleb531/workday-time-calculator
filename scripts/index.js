import '@fontsource-variable/open-sans/wght.css';
import m from 'mithril';
import '../styles/index.scss';
import AppComponent from './components/app.js';

m.mount(document.body.querySelector('main'), AppComponent);
