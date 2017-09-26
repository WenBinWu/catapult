# Copyright 2017 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

from telemetry.core import exceptions


class InspectorServiceWorker(object):
  def __init__(self, inspector_websocket, timeout):
    self._websocket = inspector_websocket
    self._websocket.RegisterDomain('ServiceWorker', self._OnNotification)
    # ServiceWorker.enable RPC must be called before calling any other methods
    # in ServiceWorker domain.
    res = self._websocket.SyncRequest(
        {'method': 'ServiceWorker.enable'}, timeout)
    if 'error' in res:
      raise exceptions.StoryActionError(res['error']['message'])

  def _OnNotification(self, msg):
    # TODO: track service worker events
    # (https://chromedevtools.github.io/devtools-protocol/tot/ServiceWorker/)
    pass

  def StopAllWorkers(self, timeout):
    res = self._websocket.SyncRequest(
        {'method': 'ServiceWorker.stopAllWorkers'}, timeout)
    if 'error' in res:
      raise exceptions.StoryActionError(res['error']['message'])
