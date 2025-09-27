'use client';

import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  useDisclosure,
} from '@chakra-ui/react';
import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import FilterSidebar from '../components/filters/FilterSidebar';
import ListingsGrid from '../components/listings/ListingsGrid';
import ListingModal from '../components/listings/ListingModal';
import { Listing, SearchFilters } from '../types';

export default function Home() {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'DESC',
  });

  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleListingClick = (listing: Listing) => {
    setSelectedListing(listing);
    onOpen();
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <Box minH="100vh">
      <Navbar />

      <Container maxW="full" px={4}>
        <Box py={6}>
          <Heading as="h1" size="xl" mb={6} color="gray.800">
            Find Your Perfect Rental
          </Heading>

          <Grid templateColumns={{ base: '1fr', lg: '300px 1fr' }} gap={6}>
            <GridItem>
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </GridItem>

            <GridItem>
              <ListingsGrid
                filters={filters}
                onListingClick={handleListingClick}
                onPageChange={handlePageChange}
              />
            </GridItem>
          </Grid>
        </Box>
      </Container>

      {selectedListing && (
        <ListingModal
          listing={selectedListing}
          isOpen={isOpen}
          onClose={onClose}
        />
      )}
    </Box>
  );
}