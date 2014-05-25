(ns drawback.sockets
  (:use org.httpkit.server)
  (:require [cheshire.core :refer :all]))

(def clients (atom {}))

(defn socket [req]
  (with-channel req channel
    (swap! clients assoc channel (str (java.util.UUID/randomUUID)))
    (println channel " connected")
    (on-close channel (fn [status]
                        (swap! clients dissoc channel)
                        (println channel " disconnected. status: " status)))
    (on-receive channel (fn [data]
                          (doseq [[client id] (dissoc @clients channel)]
                            (send! client
                                   (generate-string {:id id :data (parse-string data)}))
                            )))))
