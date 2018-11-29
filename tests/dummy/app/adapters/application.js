import { Promise } from 'rsvp';
import DS from 'ember-data';
import { RESTAdapterMixin } from 'ember-data-has-many-query';

export default DS.RESTAdapter.extend(RESTAdapterMixin, {
  namespace: 'api',
  shouldReloadAll: function() {
    return false;
  },
  shouldBackgroundReloadRecord: function() {
    return true;
  },

  //mock ajax calls for testing
  ajax: function(url, method, options) {
    var self = this;
    var i;
    // console.log('AJAX request to: ' + url + ' with options ' + JSON.stringify(options));
    return new Promise(function(resolve) {
      var response = {};
      var matchPosts = url.match(/^\/api\/posts$/);
      var matchPost = url.match(/^\/api\/posts\/(\d+)$/);
      var matchComments = url.match(/^\/api\/posts\/(\d+)\/comments$/);

      if (matchPosts) {
        response.posts = [];
        for (i = 0; i < 5; i++) {
          response.posts.push(self.generatePost(i));
        }
      } else if (matchPost) {
        var id = matchPost[1];
        response.post = self.generatePost(id);
      } else if (matchComments) {
        var commentsPage = options.data.page;
        response.comments = [];
        for (i = 0; i < 5; i++) {
          response.comments.push(self.generateComment(i + (commentsPage - 1) * 5));
        }
      }
      resolve(response);
    });
  },
  generatePost: function(id) {
    return {
      id: id,
      text: 'Post ' + id,
      links: {
        comments: '/api/posts/' + id + '/comments'
      }
    };
  },
  generateComment: function(id) {
    return {
      id: id,
      text: 'Comment ' + id
    };
  }
});
