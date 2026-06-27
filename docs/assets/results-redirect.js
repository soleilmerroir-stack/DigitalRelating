(function (global) {
  function redirectToResultsPage(options) {
    const {
      name = 'friend',
      answers = {},
      scores = {},
      sections = [],
      resultTier = 'healthy',
      referralCode = null,
      referralTier = null
    } = options || {};

    const params = new URLSearchParams();
    params.set('name', name || 'friend');
    params.set('tier', resultTier || 'healthy');

    sections.forEach((section) => {
      const value = (scores[section.id] || 0) * 5;
      params.set(section.id, value.toFixed(2));
    });

    let siQuestion = null;
    for (const section of sections) {
      const found = section.questions.find((q) => q.safety);
      if (found) {
        siQuestion = found;
        break;
      }
    }

    const si = siQuestion ? ((answers[siQuestion.n] || 0) / 5) : 0;
    params.set('si', si.toFixed(2));
    params.set('consent', ((answers[5] || 0) / 5).toFixed(2));
    params.set('shame', ((answers[6] || 0) / 5).toFixed(2));

    if (referralCode) params.set('referral_code', referralCode);
    if (referralTier) params.set('referral_tier', referralTier);

    global.location.href = 'results.html?' + params.toString();
  }

  global.redirectToResultsPage = redirectToResultsPage;
})(window);
