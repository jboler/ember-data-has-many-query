# ember-data-has-many-query

Originally created by: https://github.com/mdehoog/ember-data-has-many-query

[Ember Data](https://github.com/emberjs/data)'s `DS.Store` supports querying top-level records using the
[`query`](http://emberjs.com/api/data/classes/DS.Store.html#method_query) function. This provides support
for things like pagination and searching.

However, `DS.hasMany` and `DS.belongsTo` cannot be queried in the same way. This means pagination and searching are not
supported with has-many/belongs-to relationships.

This addon provides a way to query has-many and belongs-to relationships. Currently the `DS.RESTAdapter` and the
`DS.JSONAPIAdapter` are supported.

## Versioning

This addon is targeted at Ember & Ember Data v3.4 LTS

## Installation

`ember install ember-data-has-many-query`

## Usage

Add the `RESTAdapterMixin` to your `DS.RESTAdapter` (or `DS.JSONAPIAdapter`) extension:

```javascript
import { RESTAdapterMixin } from 'ember-data-has-many-query';

export default DS.RESTAdapter.extend(RESTAdapterMixin, {
});
```

Add the `ModelMixin` to any `DS.Model` extensions:

```javascript
import { ModelMixin } from 'ember-data-has-many-query';

export default DS.Model.extend(ModelMixin, {
});
```

Models with the mixin now support has-many/belongs-to queries:

```javascript
post.query('comments', { page: 1 });
```

## Sticky `belongs-to`

Has-many query calls `reload` on the relationship's `DS.ManyArray`. This means that all previously
queried records are cleared from the array. If you are caching the records from each query separately
(for example, in a separate array for an infinite scroll implementation), the inverse `belongs-to`
relationship is also cleared on those cached records.

If you want to keep the associated belongs-to record after a new query, you can define the belongs-to
attribute using `belongsToSticky`:

```javascript
import HasManyQuery from 'ember-data-has-many-query';

export default DS.Model.extend(HasManyQuery.ModelMixin, {
  post: HasManyQuery.belongsToSticky('post'),
});
```

This is a (pretty terrible) hack that caches the belongs-to record in a separate property, and when the
record is cleared by another query call, any property `get`s will return the cached version instead. If
anyone has ideas for better implementations, please let me know!
