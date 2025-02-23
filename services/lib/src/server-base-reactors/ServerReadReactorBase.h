#pragma once

#include "BaseReactor.h"
#include "ThreadPool.h"

#include <glog/logging.h>
#include <grpcpp/grpcpp.h>

#include <atomic>
#include <memory>
#include <string>
#include <thread>

namespace comm {
namespace network {
namespace reactor {

// This is how this type of reactor works:
// - read N requests from the client
// - write a final response to the client (may be empty)
// - terminate the connection
template <class Request, class Response>
class ServerReadReactorBase : public grpc::ServerReadReactor<Request>,
                              public BaseReactor {
  std::shared_ptr<ReactorStatusHolder> statusHolder =
      std::make_shared<ReactorStatusHolder>();

  std::atomic<int> ongoingPoolTaskCounter{0};
  Request request;

  void beginPoolTask();
  void finishPoolTask();

protected:
  Response *response;

public:
  ServerReadReactorBase(Response *response);

  // these methods come from the BaseReactor(go there for more information)
  void validate() override{};
  void doneCallback() override{};
  void terminateCallback() override{};
  std::shared_ptr<ReactorStatusHolder> getStatusHolder() override;

  // these methods come from gRPC
  // https://github.com/grpc/grpc/blob/v1.39.x/include/grpcpp/impl/codegen/client_callback.h#L237
  void OnReadDone(bool ok) override;
  void terminate(const grpc::Status &status) override;
  void OnDone() override;

  // - argument request - data read from the client in the current cycle
  // - returns status - if the connection is about to be
  // continued, nullptr should be returned. Any other returned value will
  // terminate the connection with a given status
  virtual std::unique_ptr<grpc::Status> readRequest(Request request) = 0;
};

template <class Request, class Response>
ServerReadReactorBase<Request, Response>::ServerReadReactorBase(
    Response *response)
    : response(response) {
  this->statusHolder->state = ReactorState::RUNNING;
  this->StartRead(&this->request);
}

template <class Request, class Response>
void ServerReadReactorBase<Request, Response>::OnReadDone(bool ok) {
  if (!ok) {
    // Ending a connection on the other side results in the `ok` flag being set
    // to false. It makes it impossible to detect a failure based just on the
    // flag. We should manually check if the data we received is valid
    this->terminate(grpc::Status::OK);
    return;
  }
  this->beginPoolTask();
  ThreadPool::getInstance().scheduleWithCallback(
      [this]() {
        std::unique_ptr<grpc::Status> status = this->readRequest(this->request);
        if (status != nullptr) {
          this->terminate(*status);
          return;
        }
        this->StartRead(&this->request);
      },
      [this](std::unique_ptr<std::string> err) {
        if (err != nullptr) {
          this->terminate(grpc::Status(grpc::StatusCode::INTERNAL, *err));
        }
        this->finishPoolTask();
      });
}

template <class Request, class Response>
void ServerReadReactorBase<Request, Response>::terminate(
    const grpc::Status &status) {
  this->statusHolder->setStatus(status);
  this->beginPoolTask();
  ThreadPool::getInstance().scheduleWithCallback(
      [this]() {
        this->terminateCallback();
        this->validate();
      },
      [this](std::unique_ptr<std::string> err) {
        if (err != nullptr) {
          this->statusHolder->setStatus(
              grpc::Status(grpc::StatusCode::INTERNAL, *err));
        }
        if (!this->statusHolder->getStatus().ok()) {
          LOG(ERROR) << this->statusHolder->getStatus().error_message();
        }
        if (this->statusHolder->state == ReactorState::RUNNING) {
          this->Finish(this->statusHolder->getStatus());
          this->statusHolder->state = ReactorState::TERMINATED;
        }
        this->finishPoolTask();
      });
}

template <class Request, class Response>
void ServerReadReactorBase<Request, Response>::OnDone() {
  this->beginPoolTask();
  ThreadPool::getInstance().scheduleWithCallback(
      [this]() {
        this->statusHolder->state = ReactorState::DONE;
        this->doneCallback();
      },
      [this](std::unique_ptr<std::string> err) { this->finishPoolTask(); });
}

template <class Request, class Response>
std::shared_ptr<ReactorStatusHolder>
ServerReadReactorBase<Request, Response>::getStatusHolder() {
  return this->statusHolder;
}

template <class Request, class Response>
void ServerReadReactorBase<Request, Response>::beginPoolTask() {
  this->ongoingPoolTaskCounter++;
}

template <class Request, class Response>
void ServerReadReactorBase<Request, Response>::finishPoolTask() {
  this->ongoingPoolTaskCounter--;
  if (!this->ongoingPoolTaskCounter.load() &&
      this->statusHolder->state == ReactorState::DONE) {
    // This looks weird but apparently it is okay to do this. More
    // information:
    // https://phab.comm.dev/D3246#87890
    delete this;
  }
}

} // namespace reactor
} // namespace network
} // namespace comm
