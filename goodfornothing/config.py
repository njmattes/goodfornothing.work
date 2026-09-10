#!/usr/bin/env python
# -*- coding: utf-8 -*-
import redis


class FlaskConfig(object):
    DEBUG = True
    ASSETS_DEBUG = True

    SESSION_TYPE = 'redis'
    SESSION_REDIS = redis.from_url('redis://127.0.0.1:6379')
    CACHE_KEY_PREFIX = 'goodfornothing_prod'

    ADMINS = frozenset(['matteson@obstructures.org'])
    SECRET_KEY = 'REPLACEME'

    THREADS_PER_PAGE = 8


class MongoConfig(object):
    HOST = 'localhost'
    PORT = 27017
    DATABASE = 'goodfornothing.work'
