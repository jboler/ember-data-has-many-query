import { resolve } from 'rsvp';
import $ from 'jquery';
import DS from 'ember-data';
import { module, test } from 'qunit';
import { setupStore } from '../helpers/store';
import { RESTAdapterMixin, ModelMixin, belongsToSticky } from 'ember-data-has-many-query';

const { RESTAdapter, Model, belongsTo, hasMany } = DS;

let env;

const Post = Model.extend(ModelMixin, {
  comments: hasMany('comment', { async: true })
});

const Comment = Model.extend(ModelMixin, {
  post: belongsTo('post', { async: true })
});

function initializeStore(adapter) {
  env = setupStore({
    adapter: adapter
  });

  env.registry.register('model:post', Post);
  env.registry.register('model:comment', Comment);
}

module('Integration - query-has-many', {
  beforeEach() {
    const adapter = RESTAdapter.extend(RESTAdapterMixin, {});
    initializeStore(adapter);
  },

  afterEach() {
    env = null;
  }
});

test('Querying has-many relationship generates correct URL parameters', async function(assert) {
  let ajaxCalledCount = 0;
  let requiredUrl = '';

  env.adapter.findRecord = function() {
    return resolve({
      post: { id: 5, links: { comments: '/posts/5/comments' } }
    });
  };

  env.adapter.ajax = function(url, _, options) {
    const queryString = $.param(options.data);
    assert.equal(url + '?' + queryString, requiredUrl, 'URL used to query has-many relationship is correct');
    ajaxCalledCount++;
    return resolve({ comments: [{ id: 1 }] });
  };

  const post = await env.store.findRecord('post', 5)
  requiredUrl = '/posts/5/comments?page=1';
  await post.query('comments', { page: 1 });
  requiredUrl = '/posts/5/comments?page=2';
  await post.query('comments', { page: 2 });

  assert.equal(ajaxCalledCount, 2, 'Adapter ajax function was called to query has-many relationship');
});

test('Querying has-many relationship multiple times does not clear belongs-to-sticky association', async function(assert) {
  Comment.reopen({
    post: belongsToSticky('post', { async: true })
  });

  env.adapter.findRecord = function() {
    return resolve({
      post: { id: 5, links: { comments: '/posts/5/comments' } }
    });
  };

  env.adapter.ajax = function(url, method, options) {
    const page = options.data.page;
    return resolve({
      comments: [{ id: page * 2 }, { id: page * 2 + 1 }]
    });
  };

  const post = await env.store.findRecord('post', 5);
  const comments1 = (await post.query('comments', { page: 1 })).toArray();
  const comments2 = (await post.query('comments', { page: 2 })).toArray();

  comments1.forEach(function(comment) {
    assert.equal(comment.get('post.id'), 5, 'belongs-to association sticky after multiple has-many queries');
  });

  comments2.forEach(function(comment) {
    assert.equal(comment.get('post.id'), 5, 'belongs-to association correct');
  });
});
