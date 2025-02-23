#pragma once

#include "BackupItem.h"
#include "DatabaseEntitiesTools.h"
#include "GlobalConstants.h"
#include "LogItem.h"

#include <backup.grpc.pb.h>
#include <backup.pb.h>

#include "ServerWriteReactorBase.h"

#include <folly/MPMCQueue.h>

#include <memory>
#include <string>
#include <vector>

namespace comm {
namespace network {
namespace reactor {

class PullBackupReactor : public ServerWriteReactorBase<
                              backup::PullBackupRequest,
                              backup::PullBackupResponse> {

  enum class State {
    COMPACTION = 1,
    COMPACTION_ATTACHMENTS = 2,
    LOGS = 3,
    LOG_ATTACHMENTS = 4,
  };

  std::shared_ptr<database::BackupItem> backupItem;
  std::mutex reactorStateMutex;
  State state = State::COMPACTION;
  std::vector<std::shared_ptr<database::LogItem>> logs;
  size_t currentLogIndex = 0;
  std::shared_ptr<database::LogItem> currentLog;
  std::string internalBuffer;
  std::string previousLogID;
  bool endOfQueue = false;
  bool clientInitialized = false;
  std::unique_ptr<std::string> currentLogHolder;

  const size_t chunkLimit =
      GRPC_CHUNK_SIZE_LIMIT - GRPC_METADATA_SIZE_PER_MESSAGE;

  void initializeGetReactor(const std::string &holder);
  void nextLog();
  std::string
  prepareDataChunkWithPadding(const std::string &dataChunk, size_t padding);

public:
  PullBackupReactor(const backup::PullBackupRequest *request);

  void initialize() override;

  std::unique_ptr<grpc::Status>
  writeResponse(backup::PullBackupResponse *response) override;
  void terminateCallback() override;
};

} // namespace reactor
} // namespace network
} // namespace comm
