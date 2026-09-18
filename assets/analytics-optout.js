/**
 * SHIRODO LP 計測オプトアウトのボタン(プライバシーポリシーのページだけで読み込む)
 * - 押した時点で posthog.opt_out_capturing() / opt_in_capturing() を切り替える
 * - 停止状態は PostHog がブラウザ内に保存するため、保存データを消すと計測中に戻る
 * - 計測スクリプト自体が読めていない場合(拡張機能でのブロックなど)は、その旨を出してボタンを隠す
 */
(function () {
  var TEXT = {
    ja: {
      tracking: '現在：このブラウザでの閲覧は計測されています。',
      stopped: '現在：このブラウザでの計測を停止しています。',
      blocked: '現在：計測スクリプトが読み込まれていないため、このブラウザでの閲覧は計測されていません。',
      stop: 'このブラウザでの計測を停止する',
      start: '計測を再開する'
    },
    en: {
      tracking: 'Current status: your visits from this browser are being measured.',
      stopped: 'Current status: measurement is stopped in this browser.',
      blocked: 'Current status: the analytics script is not loaded, so your visits from this browser are not being measured.',
      stop: 'Stop measurement in this browser',
      start: 'Resume measurement'
    }
  };

  function each(selector, fn) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) fn(nodes[i]);
  }

  function textOf(el, key) {
    return TEXT[el.getAttribute('data-optout-lang') === 'en' ? 'en' : 'ja'][key];
  }

  function render(state) {
    each('[data-optout-status]', function (el) {
      el.textContent = textOf(el, state);
    });
    each('[data-optout-toggle]', function (el) {
      el.hidden = state === 'blocked';
      if (state !== 'blocked') el.textContent = textOf(el, state === 'stopped' ? 'start' : 'stop');
    });
    each('.optout', function (el) {
      el.hidden = false;
    });
  }

  function state() {
    return window.posthog.has_opted_out_capturing() ? 'stopped' : 'tracking';
  }

  function start() {
    each('[data-optout-toggle]', function (el) {
      el.addEventListener('click', function () {
        if (window.posthog.has_opted_out_capturing()) window.posthog.opt_in_capturing();
        else window.posthog.opt_out_capturing();
        render(state());
      });
    });
    render(state());
  }

  // analytics.js は defer で読み込まれ、PostHog 本体はさらに非同期に読まれるため、読み込みを待つ
  var waited = 0;
  (function wait() {
    if (window.posthog && window.posthog.__loaded) return start();
    if ((waited += 100) > 5000) return render('blocked');
    setTimeout(wait, 100);
  })();
})();
