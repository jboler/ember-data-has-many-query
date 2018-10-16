import { resolve } from "rsvp";
import $ from "jquery";
import DS from "ember-data";
import { module, test } from "qunit";
import { setupStore } from "../helpers/store";
import HasManyQuery from "ember-data-has-many-query";

const { RESTAdapter, Model, belongsTo, hasMany } = DS;

var env;
var store; // eslint-disable-line

var Post = Model.extend(HasManyQuery.ModelMixin, {
  comments: hasMany("comment", { async: true })
});

var Comment = Model.extend(HasManyQuery.ModelMixin, {
  post: belongsTo("post", { async: true })
});

function initializeStore(adapter) {
  env = setupStore({
    adapter: adapter
  });

  store = env.store;

  env.registry.register("model:post", Post);
  env.registry.register("model:comment", Comment);
}

module("integration/query-has-many", {
  beforeEach() {
    var adapter = RESTAdapter.extend(HasManyQuery.RESTAdapterMixin, {});
    initializeStore(adapter);
  },
  afterEach() {
    store = null;
    env = null;
  }
});

test("Querying has-many relationship generates correct URL parameters", async function(assert) {
  var ajaxCalledCount = 0;
  var requiredUrl = "";

  env.adapter.findRecord = function() {
    return resolve({
      post: { id: 5, links: { comments: "/posts/5/comments" } }
    });
  };

  env.adapter.ajax = function(url, _, options) {
    var queryString = $.param(options.data);
    assert.equal(url + "?" + queryString, requiredUrl, "URL used to query has-many relationship is correct");
    ajaxCalledCount++;
    return resolve({ comments: [{ id: 1 }] });
  };

  let post = await env.store.findRecord("post", 5)
  requiredUrl = "/posts/5/comments?page=1";
  await post.query("comments", { page: 1 });
  requiredUrl = "/posts/5/comments?page=2";
  await post.query("comments", { page: 2 });
  assert.equal(ajaxCalledCount, 2, "Adapter ajax function was called to query has-many relationship");
});

test("Querying has-many relationship multiple times doesn't clear belongs-to-sticky association", async function(assert) {
  Comment.reopen({
    post: HasManyQuery.belongsToSticky("post", { async: true })
  });

  env.adapter.findRecord = function() {
    return resolve({
      post: { id: 5, links: { comments: "/posts/5/comments" } }
    });
  };

  env.adapter.ajax = function(url, method, options) {
    var queryString = $.param(options.data);
    var page = queryString.match(/^.*(\d+)$/)[1];
    return resolve({
      comments: [{ id: page * 2 }, { id: page * 2 + 1 }]
    });
  };

  let post = await env.store.findRecord("post", 5);
  let comments1 = await post.query("comments", { page: 1 });
  let comments1Copy = comments1.slice(0);
  let comments2 = await post.query("comments", { page: 2 });
  comments1Copy.forEach(function(comment) {
    assert.equal(comment.get("post.id"), 5, "belongs-to association sticky after multiple has-many queries");
  });
  comments2.forEach(function(comment) {
    assert.equal(comment.get("post.id"), 5, "belongs-to association correct");
  });
});
