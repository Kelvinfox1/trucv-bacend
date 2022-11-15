import asyncHandler from 'express-async-handler'
import axios from 'axios'
import moment from 'moment'
import User from '../models/userModel.js'

// @desc    welcom to mpesa api
// @route   GET /api/orders
// @access  Public
const welcome = asyncHandler(async (req, res) => {
  res.send(' The Mpesa API is running....')
})

// @desc    Getting the access token
// @route   GET /api/access_token
// @access  Private
const access_token = asyncHandler(async (req, res) => {
  res.status(200).json({ access_token: req.token })
})

// @desc    Initiating STK PUSH
// @route   POST /api/access_token
// @access  Private

const stkpush = asyncHandler(async (req, res) => {
  const token = req.token
  const auth = `Bearer ${token}`
  const timestamp = moment().format('YYYYMMDDHHmmss')
  const x = req.query.phone
  const mobile = req.query.phone
  const email = req.query.email

  console.log('phone', x)

  console.log('request body', req.body)

  const url = process.env.LIPA_NA_MPESA_URL
  const BusinessShortCode = process.env.SHORT_CODE
  const key = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'

  const password = new Buffer.from(
    `${BusinessShortCode}${key}${timestamp}`
  ).toString('base64')

  const transcation_type = 'CustomerPayBillOnline'
  const amount = '1' //you can enter any amount
  const partyA = mobile //should follow the format:2547xxxxxxxx
  const partyB = process.env.SHORT_CODE
  const phoneNumber = mobile
  const callBackUrl = `https://tru-cv-backend.herokuapp.com/api/mpesa/stk_callback?email=${email}`
  const accountReference = 'lipa-na-mpesa-tutorial'
  const transaction_desc = 'Testing lipa na mpesa functionality'

  try {
    let { data } = await axios
      .post(
        url,
        {
          BusinessShortCode: BusinessShortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: transcation_type,
          Amount: amount,
          PartyA: partyA,
          PartyB: partyB,
          PhoneNumber: phoneNumber,
          CallBackURL: callBackUrl,
          AccountReference: accountReference,
          TransactionDesc: transaction_desc,
        },
        {
          headers: {
            Authorization: auth,
          },
        }
      )
      .catch(console.log)

    return res.send({
      success: true,
      message: data,
    })
  } catch (err) {
    res.status(404)
    throw new Error(err)
  }
})

const lipaNaMpesaOnlineCallback = asyncHandler(async (req, res) => {
  //Get the transaction description
  let message = req.body.Body
  console.log('recipet', message)

  const { email } = req.query.email

  console.log('email', { email })

  const user = await User.findOne({ email })

  if (user) {
    user.paymentResult = {
      id: message.stkCallback.CheckoutRequestID,
      status: message.stkCallbac.ResultCode,
      paidAt: Date.now(),
    }

    const updatedUser = await user.save()

    console.log(updatedUser)

    res.json({
      paymentResult: updatedUser.paymentResult,
    })
  } else {
    res.status(404)
    throw new Error('failed')
    console.log('failed')
  }

  return res.send({
    success: true,
    message: message,
  })
})

export { welcome, access_token, stkpush, lipaNaMpesaOnlineCallback }
