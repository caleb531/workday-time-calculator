import m from 'mithril';

class PrevIconComponent {

  view() {
    return m('svg[viewBox="0 0 32 32"]', m('polyline', {
      points: '20,10 13,16 20,22'
    }));
  }

}

export default PrevIconComponent;
