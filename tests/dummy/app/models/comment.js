import DS from 'ember-data';
import { ModelMixin, belongsToSticky } from 'ember-data-has-many-query';

export default DS.Model.extend(ModelMixin, {
  text: DS.attr('string'),
  post: belongsToSticky('post', { async: true })
});
