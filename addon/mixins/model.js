import Mixin from '@ember/object/mixin';
import { run } from '@ember/runloop';
import { Promise } from 'rsvp';
import DS from 'ember-data';
import {
  queryParamPropertyName,
  queryIdPropertyName,
  lastWasErrorPropertyName,
  ajaxOptionsPropertyName,
  stickyPropertyName
} from '../property-names';
import { recordHasId } from '../belongs-to-sticky';

let queryId = 0;

/**
 * Mixin for DS.Model extensions.
 */

export default Mixin.create({
  init(...args) {
    this._super(...args);

    // Set sticky properties on init
    this.eachRelationship(key => {
      this._setStickyPropertyForKey(key);
    });
  },

  /**
   * Query a HasMany/BelongsTo relationship link.
   *
   * If you do something like this:
   * ```javascript
   * post.query('comments', { page: 1 });
   * ```
   *
   * The call made to the server will look something like this:
   * ```
   * Started GET "/api/v1/post/1/comments?page=1"
   * ```
   *
   * @param {String} propertyName Relationship property name
   * @param {Object} params Query parameters
   * @returns {Ember.RSVP.Promise}
   */

  query(propertyName, params) {
    // Abort the last query request for this property
    const _ajaxOptionsPropertyName = ajaxOptionsPropertyName(propertyName);
    const lastAjaxOptions = this.get(_ajaxOptionsPropertyName);
    if (lastAjaxOptions && lastAjaxOptions.jqXHR) {
      lastAjaxOptions.jqXHR.abort();
    }

    // Set the query params as a property on this record
    const _queryParamPropertyName = queryParamPropertyName(propertyName);
    const _queryIdPropertyName = queryIdPropertyName(propertyName);
    const currentQueryId = queryId++;

    const oldParams = this.get(_queryParamPropertyName, params)

    this.set(_queryParamPropertyName, params);
    this.set(_queryIdPropertyName, currentQueryId);

    // Get the relationship value, reloading if necessary
    const value = this.reloadRelationship(propertyName, JSON.stringify(params) === JSON.stringify(oldParams));

    // Return the promise, clearing the ajax options property
    return value.catch(function (error) {
      // Ignore aborted requests
      if (error instanceof DS.AbortError) return;
      throw error;
    }).finally(() => {
      // Don't clear parameters if they've been set by another request
      if (this.get(_queryIdPropertyName) !== currentQueryId) return;
      this.set(_ajaxOptionsPropertyName, undefined);
    });
  },

  /**
   * Get the relationship property for the given property name, reloading the async relationship if necessary.
   *
   * @param propertyName Relationship property name
   * @returns {Ember.RSVP.Promise}
   */

  reloadRelationship(propertyName, forceReload) {
    // Find out what kind of relationship this is
    const relationship = this.relationshipFor(propertyName);
    const isHasMany = relationship && relationship.kind === 'hasMany';
    const reference = isHasMany ? this.hasMany(propertyName) : this.belongsTo(propertyName);

    return new Promise(resolve => {
      // Use run.next, so that aborted promise gets rejected before starting another
      run.next(this, () => {
        const isLoaded = reference.value() !== null;
        if (isLoaded || forceReload) {
          resolve(reference.reload());
        } else {
          // isLoaded is false when the last query resulted in an error, so if this load
          // results in an error again, reload the reference to query the server again
          const promise = reference.load().catch(function (error) {
            const _lastWasErrorPropertyName = lastWasErrorPropertyName(propertyName);
            if (this.get(_lastWasErrorPropertyName)) {
              // Last access to this property resulted in an error, so reload
              return reference.reload();
            }
            // Mark this result as an error for next time the property is queried
            this.set(_lastWasErrorPropertyName, true);
            throw error;
          });
          resolve(promise);
        }
      });
    });
  },

  // Called when a belongsTo property changes
  notifyBelongsToChanged(key) {
    this._super(...arguments);
    this._setStickyPropertyForKey(key);
  },

  _setStickyPropertyForKey(key) {
    // Check if the belongsTo relationship has been marked as sticky
    const meta = this.constructor.metaForProperty(key);
    if (!meta.sticky) return;

    // Check if the value is loaded
    const reference = this.belongsTo(key);
    const value = reference && reference.value();
    if (!recordHasId(value) || value.get('isEmpty')) return;

    // If a belongsTo relationship attribute has changed, and the new record has an id,
    // store the record in a property so that the belongsToSticky can return if it required
    this.set(stickyPropertyName(key), value);
  }
});
