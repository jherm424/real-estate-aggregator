'use client';

import {
  Box,
  Card,
  CardBody,
  Image,
  Stack,
  Heading,
  Text,
  Button,
  Badge,
  HStack,
  VStack,
  Icon,
  Flex,
  AspectRatio,
} from '@chakra-ui/react';
import { FaBed, FaBath, FaRulerCombined, FaCar, FaMapMarkerAlt } from 'react-icons/fa';
import { Listing } from '../../types';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
}

export default function ListingCard({ listing, onClick }: ListingCardProps) {
  const formatPrice = (price: number, currency = 'CAD') => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPropertyTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      house: 'blue',
      condo: 'green',
      townhouse: 'purple',
      apartment: 'orange',
      land: 'yellow',
      commercial: 'red',
      other: 'gray',
    };
    return colors[type] || 'gray';
  };

  const getSourceBadgeColor = (source: string) => {
    const colors: Record<string, string> = {
      realtor_ca: 'blue',
      mls: 'green',
      kijiji: 'orange',
      other: 'gray',
    };
    return colors[source] || 'gray';
  };

  const defaultImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';

  return (
    <Card
      maxW="sm"
      cursor="pointer"
      onClick={onClick}
      transition="all 0.2s"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'xl',
      }}
      overflow="hidden"
    >
      <AspectRatio ratio={16 / 9}>
        <Image
          src={listing.images[0] || defaultImage}
          alt={listing.title}
          objectFit="cover"
          fallbackSrc={defaultImage}
        />
      </AspectRatio>

      <CardBody>
        <Stack spacing={3}>
          {/* Header with price and badges */}
          <Flex justify="space-between" align="flex-start">
            <VStack align="flex-start" spacing={1} flex={1}>
              <Text fontSize="2xl" fontWeight="bold" color="primary.600">
                {formatPrice(listing.price)}{listing.listing_type === 'rent' && '/month'}
              </Text>
              <HStack spacing={2}>
                <Badge colorScheme={getPropertyTypeColor(listing.property_type)} size="sm">
                  {listing.property_type}
                </Badge>
                <Badge colorScheme={getSourceBadgeColor(listing.source)} variant="outline" size="sm">
                  {listing.source.replace('_', '.')}
                </Badge>
              </HStack>
            </VStack>
          </Flex>

          {/* Title */}
          <Heading size="md" noOfLines={2} minH="2.5rem">
            {listing.title}
          </Heading>

          {/* Location */}
          <HStack spacing={1} color="gray.600">
            <Icon as={FaMapMarkerAlt} boxSize={3} />
            <Text fontSize="sm" noOfLines={1}>
              {listing.city}, {listing.province}
            </Text>
          </HStack>

          {/* Property details */}
          <HStack spacing={4} justify="space-between">
            {listing.bedrooms && (
              <HStack spacing={1}>
                <Icon as={FaBed} color="gray.500" boxSize={3} />
                <Text fontSize="sm" color="gray.600">
                  {listing.bedrooms}
                </Text>
              </HStack>
            )}

            {listing.bathrooms && (
              <HStack spacing={1}>
                <Icon as={FaBath} color="gray.500" boxSize={3} />
                <Text fontSize="sm" color="gray.600">
                  {listing.bathrooms}
                </Text>
              </HStack>
            )}

            {listing.square_feet && (
              <HStack spacing={1}>
                <Icon as={FaRulerCombined} color="gray.500" boxSize={3} />
                <Text fontSize="sm" color="gray.600">
                  {listing.square_feet.toLocaleString()} sq ft
                </Text>
              </HStack>
            )}

            {listing.parking && listing.parking > 0 && (
              <HStack spacing={1}>
                <Icon as={FaCar} color="gray.500" boxSize={3} />
                <Text fontSize="sm" color="gray.600">
                  {listing.parking}
                </Text>
              </HStack>
            )}
          </HStack>

          {/* Address */}
          <Text fontSize="sm" color="gray.500" noOfLines={1}>
            {listing.address}
          </Text>

          {/* View Details Button */}
          <Button
            colorScheme="primary"
            size="sm"
            variant="outline"
            width="full"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            View Details
          </Button>
        </Stack>
      </CardBody>
    </Card>
  );
}