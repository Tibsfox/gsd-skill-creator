/* WordPress Comment Widget — vanilla JS, < 4KB */
(function () {
  'use strict';

  var container = document.querySelector('[data-wp-post-id]');
  if (!container) return;

  var postId = container.getAttribute('data-wp-post-id');
  var api = container.getAttribute('data-wp-api');
  if (!postId || !api) return;

  var listEl = document.getElementById('wp-comment-list');
  var formEl = document.getElementById('wp-comment-form');
  var page = 1;
  var perPage = 20;
  var totalComments = 0;

  /* --- Fetch & render comments --- */

  function fetchComments(pg) {
    var url = api + '/comments?post=' + postId + '&per_page=' + perPage + '&order=asc&page=' + pg;
    fetch(url)
      .then(function (r) {
        totalComments = parseInt(r.headers.get('X-WP-Total') || '0', 10);
        return r.json();
      })
      .then(function (comments) {
        renderComments(comments);
        if (page * perPage < totalComments) renderLoadMore();
      })
      .catch(function () {
        listEl.innerHTML = '<p class="wp-comments__error">Unable to load comments.</p>';
      });
  }

  function renderComments(comments) {
    var html = '';
    for (var i = 0; i < comments.length; i++) {
      var c = comments[i];
      html += '<div class="wp-comment">';
      html += '<p class="wp-comment__meta"><strong>' + esc(c.author_name) + '</strong> &mdash; ';
      html += '<time>' + new Date(c.date).toLocaleDateString() + '</time></p>';
      html += '<div class="wp-comment__body">' + c.content.rendered + '</div>';
      html += '</div>';
    }
    listEl.innerHTML += html;
  }

  function renderLoadMore() {
    var btn = document.createElement('button');
    btn.className = 'wp-comments__more';
    btn.textContent = 'Load more comments';
    btn.addEventListener('click', function () {
      btn.remove();
      page++;
      fetchComments(page);
    });
    listEl.appendChild(btn);
  }

  /* --- Comment form --- */

  function renderForm() {
    formEl.innerHTML =
      '<form id="wp-comment-submit">' +
      '<label>Name <input type="text" name="author_name" required></label>' +
      '<label>Email <input type="email" name="author_email" required></label>' +
      '<label>Comment <textarea name="content" required></textarea></label>' +
      '<button type="submit">Submit Comment</button>' +
      '<p class="wp-comments__status" aria-live="polite"></p>' +
      '</form>';

    document.getElementById('wp-comment-submit').addEventListener('submit', function (e) {
      e.preventDefault();
      submitComment(this);
    });
  }

  function submitComment(form) {
    var status = form.querySelector('.wp-comments__status');
    var body = {
      post: parseInt(postId, 10),
      author_name: form.author_name.value,
      author_email: form.author_email.value,
      content: form.content.value,
    };
    status.textContent = 'Submitting...';

    fetch(api + '/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (r) {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(function () {
        status.textContent = 'Comment submitted for moderation.';
        form.content.value = '';
      })
      .catch(function (err) {
        status.textContent = 'Error: ' + err.message + '. Please try again.';
      });
  }

  /* --- Helpers --- */

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  /* --- Init --- */

  container.style.display = '';
  fetchComments(page);
  renderForm();
})();
