xhrPromise = require '../util/xhr-promise'
executeMultiple = require 'fluxible-action-utils/async/executeMultiple'
config        = require '../config'

setOrigin = (actionContext, location, done) ->
  actionContext.dispatch "setOrigin",
    lat: location.lat
    lon: location.lon
    address: location.address

setDestination = (actionContext, location, done) ->
  actionContext.dispatch "setDestination",
    lat: location.lat
    lon: location.lon
    address: location.address

setOriginToCurrent = (actionContext, done) ->
  actionContext.dispatch "setOriginToCurrent",

setDestinationToCurrent = (actionContext, done) ->
  actionContext.dispatch "setDestinationToCurrent",

module.exports =
  'setOrigin': setOrigin
  'setDestination': setDestination
  'setOriginToCurrent': setOriginToCurrent
  'setDestinationToCurrent': setDestinationToCurrent
