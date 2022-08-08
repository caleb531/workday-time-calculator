import m from 'mithril';

class NextControlIconComponent {

  view() {
    return m('svg[viewBox="0 0 32 32"]', m('polyline', {
      points: '12,10 19,16 12,22'
    }));
  }

}

export default NextControlIconComponent;
