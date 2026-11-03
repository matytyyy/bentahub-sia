// One place that turns every error into the same JSON shape: { success:false, error }
module.exports = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server Error';

  if (err.code === 'ER_DUP_ENTRY') { status = 409; message = 'That record already exists (duplicate value)'; }
  else if (err.code === 'ER_NO_REFERENCED_ROW_2') { status = 400; message = 'Invalid reference: a related record does not exist'; }
  else if (err.code === 'ER_ROW_IS_REFERENCED_2') { status = 409; message = 'Cannot delete: other records depend on this one'; }
  else if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') { status = 400; message = 'A value breaks a database rule (check constraint)'; }
  else if (err.type === 'entity.parse.failed') { status = 400; message = 'Malformed JSON in request body'; }

  if (status === 500) {
    console.error(err);
    message = 'Server Error';
  }
  res.status(status).json({ success: false, error: message });
};
