'use client';

import {
  Box,
  Flex,
  Heading,
  HStack,
  Button,
  useColorModeValue,
  Container,
  IconButton,
  useDisclosure,
  VStack,
  Collapse,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import Link from 'next/link';

const NavLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
  <Link href={href} passHref>
    <Button
      variant="ghost"
      size="sm"
      _hover={{
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700'),
      }}
    >
      {children}
    </Button>
  </Link>
);

export default function Navbar() {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box
      bg={useColorModeValue('white', 'gray.900')}
      borderBottom={1}
      borderStyle="solid"
      borderColor={useColorModeValue('gray.200', 'gray.900')}
      shadow="sm"
    >
      <Container maxW="full" px={4}>
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <IconButton
            size="md"
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label="Open Menu"
            display={{ md: 'none' }}
            onClick={onToggle}
          />

          <HStack spacing={8} alignItems="center">
            <Link href="/" passHref>
              <Heading
                as="h1"
                size="md"
                cursor="pointer"
                color="primary.600"
                _hover={{ color: 'primary.700' }}
              >
                RealEstate Aggregator
              </Heading>
            </Link>

            <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
              <NavLink href="/">Browse Listings</NavLink>
              <NavLink href="/favorites">Favorites</NavLink>
              <NavLink href="/saved-searches">Saved Searches</NavLink>
              <NavLink href="/stats">Statistics</NavLink>
              <NavLink href="/admin">Admin</NavLink>
            </HStack>
          </HStack>

          <Flex alignItems="center">
            <Button
              variant="outline"
              colorScheme="primary"
              size="sm"
              mr={4}
              display={{ base: 'none', md: 'inline-flex' }}
            >
              Sign In
            </Button>
            <Button
              colorScheme="primary"
              size="sm"
              display={{ base: 'none', md: 'inline-flex' }}
            >
              Sign Up
            </Button>
          </Flex>
        </Flex>

        <Collapse in={isOpen} animateOpacity>
          <Box pb={4} display={{ md: 'none' }}>
            <VStack as="nav" spacing={4}>
              <NavLink href="/">Browse Listings</NavLink>
              <NavLink href="/favorites">Favorites</NavLink>
              <NavLink href="/saved-searches">Saved Searches</NavLink>
              <NavLink href="/stats">Statistics</NavLink>
              <NavLink href="/admin">Admin</NavLink>
              <Button variant="outline" colorScheme="primary" size="sm" w="full">
                Sign In
              </Button>
              <Button colorScheme="primary" size="sm" w="full">
                Sign Up
              </Button>
            </VStack>
          </Box>
        </Collapse>
      </Container>
    </Box>
  );
}