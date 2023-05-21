import m from 'mithril';
import AppComponent from './components/app.js';
import '../styles/index.scss';
import '@fontsource-variable/open-sans/wght.css';

m.mount(document.body.querySelector('main'), AppComponent);
