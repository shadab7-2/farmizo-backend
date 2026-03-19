const apiResponse = ({ success = true, message = "", data = null, error = null, status = 200 }) => ({
  success,
  message,
  data,
  error,
  status,
});

module.exports = apiResponse;
