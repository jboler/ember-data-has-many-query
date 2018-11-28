import DS from 'ember-data';
import { computed } from '@ember/object';
import { stickyPropertyName } from './property-names';

const recordHasId = record => record && record.get('id');

/**
 * Create an extension to the `DS.belongsTo` computed property that returns a cached
 * record if the current associated belongsTo record doesn't have an id.
 *
 * This may be useful if querying a hasMany relationship multiple times and storing
 * the results, as each query will reset the ManyArray and therefore remove the inverse
 * belongsTo association. Defining a relationship as `belongsToSticky` will keep the
 * associated record even if it is removed from the ManyArray.
 *
 * @returns {Ember.computed} relationship
 */

const belongsToSticky = (...args) => {
  const computedProp = DS.belongsTo(...args);
  const meta = computedProp.meta();
  meta.sticky = true;

  return computed({
    get(key) {
      const value = computedProp._getter.call(this, ...arguments);
      if (recordHasId(value)) {
        return value;
      }
      return this.get(stickyPropertyName(key)) || value;
    },
    set(key) {
      this.set(stickyPropertyName(key), undefined);
      return computedProp._setter.call(this, ...arguments);
    }
  }).meta(meta);
};

export { recordHasId };
export default belongsToSticky;
