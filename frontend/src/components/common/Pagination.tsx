'use client';

import {
  HStack,
  Button,
  Text,
  IconButton,
  Select,
  Box,
  Flex,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  showPageSize?: boolean;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNext,
  hasPrev,
  showPageSize = false,
  pageSize = 20,
  onPageSizeChange,
}: PaginationProps) {
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = generatePageNumbers();

  return (
    <Flex
      justify="space-between"
      align="center"
      wrap="wrap"
      gap={4}
      py={4}
    >
      <HStack spacing={2} flex={1} justify="center">
        {/* Previous Button */}
        <IconButton
          aria-label="Previous page"
          icon={<ChevronLeftIcon />}
          size="sm"
          variant="outline"
          isDisabled={!hasPrev}
          onClick={() => onPageChange(currentPage - 1)}
        />

        {/* Page Numbers */}
        {pageNumbers.map((page, index) => (
          <Box key={index}>
            {page === '...' ? (
              <Text px={2} fontSize="sm" color="gray.500">
                ...
              </Text>
            ) : (
              <Button
                size="sm"
                variant={page === currentPage ? 'solid' : 'outline'}
                colorScheme={page === currentPage ? 'primary' : 'gray'}
                onClick={() => onPageChange(page as number)}
                minW="40px"
              >
                {page}
              </Button>
            )}
          </Box>
        ))}

        {/* Next Button */}
        <IconButton
          aria-label="Next page"
          icon={<ChevronRightIcon />}
          size="sm"
          variant="outline"
          isDisabled={!hasNext}
          onClick={() => onPageChange(currentPage + 1)}
        />
      </HStack>

      {/* Page Size Selector */}
      {showPageSize && onPageSizeChange && (
        <HStack spacing={2}>
          <Text fontSize="sm" color="gray.600">
            Show:
          </Text>
          <Select
            size="sm"
            width="auto"
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Select>
          <Text fontSize="sm" color="gray.600">
            per page
          </Text>
        </HStack>
      )}
    </Flex>
  );
}