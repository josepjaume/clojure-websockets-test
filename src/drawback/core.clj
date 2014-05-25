(ns drawback.core
  (:use [compojure.core :only (defroutes GET)]
        ring.util.response
        ring.middleware.cors
        org.httpkit.server
        aleph.http)
  (:require [compojure.route :as route]
            [compojure.handler :as handler]
            [drawback.sockets :as sockets]
            [ring.middleware.reload :as reload]))

(defroutes routes
  (GET "/socket" [] sockets/socket)
  (route/resources "/")
  (GET "/" [] (file-response "resources/index.html")))

(def application (-> (handler/site routes)
                     reload/wrap-reload
                     (wrap-cors
                       :access-control-allow-origin #".+")))

(let [port (Integer/parseInt (or (System/getenv "PORT") "8080"))]
  (defn -main [& args]
    (run-server application {:port port :join? false})))
