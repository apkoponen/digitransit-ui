Dispatcher = require '../dispatcher/dispatcher.coffee'
Store = require './store.coffee'
LocationStore = require './location-store.coffee'

class NearestStopsStore extends Store
  constructor: ->
    super()
    @nearestStops = [];
    @register()

  removeNearestStops: ->
    @nearestStops = [];

  storeNearestStops: (nearestStops) ->
    nearestStops.sort (a,b) ->
      if a.dist > b.dist then 1 else -1
    @nearestStops = nearestStops
    @emitChanges()

  register: -> 
    @dispatchToken = Dispatcher.register (action) =>
      Dispatcher.waitFor [LocationStore.dispatchToken]
      switch action.actionType
        when "NearestStopsFound" then @storeNearestStops(action.nearestStops)
        when "NearestStopsRemoved" then @removeNearestStops()
      
module.exports = new NearestStopsStore()