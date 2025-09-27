'use client';

import {
  Box,
  Grid,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  VStack,
  HStack,
  Button,
  Select,
  Flex,
  Badge,
} from '@chakra-ui/react';
import { useQuery } from 'react-query';
import { listingsApi } from '../../services/api';
import { Listing, SearchFilters } from '../../types';
import ListingCard from './ListingCard';
import Pagination from '../common/Pagination';

interface ListingsGridProps {
  filters: SearchFilters;
  onListingClick: (listing: Listing) => void;
  onPageChange: (page: number) => void;
}

export default function ListingsGrid({
  filters,
  onListingClick,
  onPageChange,
}: ListingsGridProps) {
  const {
    data,
    isLoading,
    error,
    isError,
  } = useQuery(
    ['listings', filters],
    () => listingsApi.getListings(filters),
    {
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, sortOrder] = e.target.value.split('_');
    // This would need to be passed up to parent component
    // onFilterChange({ sort_by: sortBy, sort_order: sortOrder });
  };

  if (isLoading) {
    return (
      <VStack spacing={4} py={8}>
        <Spinner size="lg" color="primary.500" />
        <Text>Loading listings...</Text>
      </VStack>
    );
  }

  if (isError) {
    return (
      <Alert status="error">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Error loading listings</Text>
          <Text fontSize="sm">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </Text>
        </Box>
      </Alert>
    );
  }

  if (!data || data.listings.length === 0) {
    return (
      <VStack spacing={4} py={8}>
        <Text fontSize="lg" color="gray.600">
          No listings found matching your criteria
        </Text>
        <Text fontSize="sm" color="gray.500">
          Try adjusting your filters or search in a different area
        </Text>
      </VStack>
    );
  }

  const { listings, pagination } = data;

  return (
    <Box>
      {/* Results header */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack spacing={4}>
          <Text fontSize="lg" fontWeight="medium">
            {pagination.total_count.toLocaleString()} listings found
          </Text>
          <Badge colorScheme="primary" variant="subtle">
            Page {pagination.current_page} of {pagination.total_pages}
          </Badge>
        </HStack>

        <Select
          size="sm"
          width="auto"
          onChange={handleSortChange}
          defaultValue={`${filters.sort_by}_${filters.sort_order}`}
        >
          <option value="created_at_DESC">Newest First</option>
          <option value="created_at_ASC">Oldest First</option>
          <option value="price_ASC">Price: Low to High</option>
          <option value="price_DESC">Price: High to Low</option>
          <option value="bedrooms_DESC">Most Bedrooms</option>
          <option value="square_feet_DESC">Largest First</option>
        </Select>
      </Flex>

      {/* Listings grid */}
      <Grid
        templateColumns={{
          base: '1fr',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
          xl: 'repeat(4, 1fr)',
        }}
        gap={6}
        mb={8}
      >
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onClick={() => onListingClick(listing)}
          />
        ))}
      </Grid>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <Pagination
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          onPageChange={onPageChange}
          hasNext={pagination.has_next}
          hasPrev={pagination.has_prev}
        />
      )}

      {/* Load more button for mobile */}
      {pagination.has_next && (
        <Flex justify="center" mt={6} display={{ base: 'flex', md: 'none' }}>
          <Button
            variant="outline"
            onClick={() => onPageChange(pagination.current_page + 1)}
          >
            Load More
          </Button>
        </Flex>
      )}
    </Box>
  );
}