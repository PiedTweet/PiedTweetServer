export const USERS_MESSAGES = {
  UPLOAD_SUCCESS: 'Upload success',
  EMAIL_NOT_VERIFIED: 'Email not verified',
  CHANGE_PASSWORD_SUCCESS: 'Change password success',
  OLD_PASSWORD_IS_INCORRECT: 'Old password is incorrect',
  USERNAME_IS_INVALID: 'Username is invalid',
  USERNAME_ALREADY_EXISTS: 'Username already exists',
  UNFOLLOW_SUCCESS: 'Unfollow success',
  USER_ALREADY_UNFOLLOWED: 'User already unfollowed',
  INVALID_USER_ID: 'Invalid user id',
  FOLLOW_SUCCESS: 'Follow success',
  USER_ALREADY_FOLLOWED: 'User already followed',
  CANNOT_FOLLOW_YOURSELF: 'Cannot follow yourself',
  INVALID_FOLLOWED_USER_ID: 'Invalid followed user id',
  FOLLOWED_USER_ID_IS_REQUIRED: 'Followed user id is required',
  GET_PROFILE_SUCCESS: 'Get profile success',
  UPDATE_ME_SUCCESS: 'Update me success',
  USERNAME_LENGTH_MUST_BE_LESS_THAN_50: 'Username length must be less than 50',
  USERNAME_MUST_BE_A_STRING: 'Username must be a string',
  WEBSITE_LENGTH_MUST_BE_LESS_THAN_200: 'Website length must be less than 200',
  WEBSITE_MUST_BE_A_STRING: 'Website must be a string',
  LOCATION_LENGTH_MUST_BE_LESS_THAN_200: 'Location length must be less than 200',
  LOCATION_MUST_BE_A_STRING: 'Location must be a string',
  BIO_LENGTH_MUST_BE_LESS_THAN_200: 'Bio length must be less than 200',
  BIO_MUST_BE_A_STRING: 'Bio must be a string',
  IMAGE_URL_LENGTH_MUST_BE_FROM_1_TO_400: 'Image url length must be from 1 to 400',
  IMAGE_URL_MUST_BE_A_STRING: 'Image url must be a string',
  USER_NOT_VERIFIED: 'User not verified',
  GET_ME_SUCCESS: 'Get me success',
  RESET_PASSWORD_SUCCESS: 'Reset password success',
  VALIDATION_ERROR: 'Validation error',
  //name
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_A_STRING: 'Name must be a string',
  NAME_LENGTH_MUST_BE_FROM_1_TO_100: 'Name length must be from 1 to 100',
  //email
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_IS_INVALID: 'Email is invalid',
  //password
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_A_STRING: 'Password must be a string',
  PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50: 'Password length must be from 8 to 50',
  PASSWORD_MUST_BE_STRONG:
    'Password must be at least 8 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
  //confirmPassword
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirm password must be a string',
  CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50: 'Confirm length must be from 8 to 50',
  CONFIRM_PASSWORD_MUST_BE_STRONG:
    'Confirm password must be at least 8 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
  CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD: 'Confirm password must be the same as password',
  //dateOfBirth
  DATE_OF_BIRTH_BE_ISO8601: 'Date of birth must be ISO8601',
  //user
  EMAIL_OR_PASSWORD_IS_INCORRECT: 'Email or password is incorrect',
  LOGIN_SUCCESS: 'Login success',
  REGISTER_SUCCESS: 'Register success',
  // access token
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',

  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',

  REFRESH_TOKEN_IS_NOT_EXIST: 'Refresh token is not exist',
  EMAIL_VERIFY_TOKEN_IS_REQUIRED: 'Email verify token is required',

  LOGOUT_SUCCESS: 'Logout success',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_VERIFIED_BEFORE: 'Email already verified before',
  EMAIL_VERIFY_SUCCESS: 'Email verify success',
  RESEND_EMAIL_VERIFY_SUCCESS: 'Resend email verify success',
  USER_BANNED: 'User banned',
  EMAIL_VERIFY_TOKEN_IS_INCORRECT: 'Email verify token is incorrect',
  CHECK_EMAIL_TO_RESET_PASSWORD: 'Check email to reset password',
  FORGOT_PASSWORD_TOKEN_IS_INCORRECT: 'Forgot password token is incorrect',
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token is required',

  VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS: 'Verify forgot password token success'
} as const

export const TWEETS_MESSAGES = {
  TYPE_MUST_BE_NOT_EMPTY: 'Type must be not empty',
  AUDIENCE_MUST_BE_NOT_EMPTY: 'Audience must be not empty',
  TWEET_CREATED_SUCCESSFULLY: 'Tweet created success',
  INVALID_TYPE: 'Invalid type',
  INVALID_AUDIENCE: 'Invalid audience',
  PARENT_ID_MUST_BE_A_VALID_TWEET_ID: 'Parent id must be a valid tweet id',
  PARENT_ID_MUST_BE_NULL: 'Parent id must be null',
  CONTENT_MUST_BE_NULL: 'Content must be null',
  CONTENT_MUST_BE_A_NON_EMPTY_STRING: 'Content must be a non-empty string',
  HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING: 'Hashtags must be an array of string',
  MENTIONS_MUST_BE_AN_ARRAY_OF_user_id: 'Mentions must be an array of user id',
  MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT: 'Medias must be an array of media object',
  CONTENT_MUST_BE_EMPTY_STRING: 'Content must be empty string'
} as const
