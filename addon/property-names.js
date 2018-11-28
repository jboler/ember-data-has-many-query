const queryParamPropertyName = key => `__${key}QueryParams`;
const queryIdPropertyName = key => `__${key}QueryId`;
const lastWasErrorPropertyName = key => `__${key}LastWasError`;
const ajaxOptionsPropertyName = key => `__${key}AjaxOptions`;
const stickyPropertyName = key => `__${key}BelongsToSticky`;

export {
  queryParamPropertyName,
  queryIdPropertyName,
  lastWasErrorPropertyName,
  ajaxOptionsPropertyName,
  stickyPropertyName
};
