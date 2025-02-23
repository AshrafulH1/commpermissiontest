#pragma once

#include <blob.pb.h>

#include <string>

namespace comm {
namespace network {
namespace tools {

std::string generateRandomString(std::size_t length = 20);

std::string generateHolder(
    const std::string &blobHash,
    const std::string &backupID,
    const std::string &resourceID = "");

std::string validateAttachmentHolders(const std::string &holders);

int charPtrToInt(const char *str);

size_t getBlobPutField(blob::PutRequest::DataCase field);

} // namespace tools
} // namespace network
} // namespace comm
