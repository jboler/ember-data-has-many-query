import DS from 'ember-data';
import { ModelMixin } from 'ember-data-has-many-query';

export default DS.Model.extend(ModelMixin, {
  text: DS.attr('string'),
  comments: DS.hasMany('comment', { async: true })
});
