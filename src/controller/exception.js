class HttpException extends Error {
  #statusCode;
  constructor(statusCode, message) {
    super(message);
    this.#statusCode = statusCode;
  }

  get statusCode() {
    return this.#statusCode;
  }
}

class BadRequestException extends HttpException {
  constructor(message) {
    super(401, message);
  }
}

class NotFoundException extends HttpException {
  constructor(message) {
    super(404, message);
  }
}

class ForbiddenException extends HttpException {
  constructor(message) {
    super(403, message);
  }
}

module.exports = {
  HttpException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
};
